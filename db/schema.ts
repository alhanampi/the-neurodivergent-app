import { boolean, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * One row per Clerk user, kept in sync by the Clerk webhook
 * (api/webhooks/clerk.ts). `id` is the Clerk user id — we never generate
 * our own, so there's one obvious join key everywhere else in the schema.
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * User preferences that live in the DB instead of (or in addition to)
 * localStorage, so they follow the account across devices. Starts with just
 * language; theme/notifications etc. join here as they need to persist
 * server-side too.
 */
export const preferences = pgTable('preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  language: text('language').notNull().default('en'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * One row per finished (completed or manually stopped) timer run. `presetId`
 * identifies a built-in preset (see TimersTab.constants.ts on the client —
 * deliberately not duplicated here as a Postgres enum, since the preset list
 * is UI config, not a domain invariant the DB needs to enforce) or 'custom'
 * for a user-defined duration; `label` only holds a value for custom timers,
 * since presets are translated client-side from `presetId`.
 */
export const timerSessions = pgTable('timer_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  presetId: text('preset_id').notNull(),
  label: text('label'),
  plannedSeconds: integer('planned_seconds').notNull(),
  actualSeconds: integer('actual_seconds').notNull(),
  completed: boolean('completed').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }).notNull(),
})

/**
 * One row per AI Chat conversation (iteration 8). `title` is always
 * populated — derived from the first user message (see
 * api/chat.utils.ts's deriveConversationTitle) unless renamed via
 * PUT /api/conversations/[id]. `updatedAt` is bumped whenever a new message
 * (of either role) is appended — the sidebar's "Today/Yesterday/This
 * week/Older" grouping and its sort order are both based on this, not
 * `createdAt`, so a conversation reads as recent by last activity.
 */
export const conversations = pgTable(
  'conversations',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('conversations_user_updated_idx').on(table.userId, table.updatedAt)],
)

/**
 * One row per chat turn (iteration 8). `role` is always 'user' or
 * 'assistant' — deliberately matching Groq's own OpenAI-compatible message
 * role vocabulary, so a row maps straight into a Groq API message with no
 * translation. The system prompt is never stored here — it's rebuilt fresh
 * per request (see api/chat.utils.ts's buildSystemPrompt) so it always
 * reflects the caller's *current* UI language, not whatever language was
 * active when the conversation started.
 */
export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('messages_conversation_created_idx').on(table.conversationId, table.createdAt)],
)

/**
 * One row per checklist item on the Tasks tab (iteration 8). Created in a
 * batch from an approved AI Chat plan (POST /api/tasks), but deliberately
 * has no FK back to the source conversation — traceability wasn't part of
 * the ask, and keeping this table standalone keeps deleting a conversation
 * from ever affecting tasks the user already has in their list.
 * `estimatedMinutes` is a display label only, not a running timer — the
 * whole point of this tab is a checklist without timer pressure (see
 * ROADMAP.md's iteration 8 notes).
 */
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})
