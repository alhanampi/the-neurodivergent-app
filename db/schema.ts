import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

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
 *
 * `taskId`/`subtaskId` (iteration 8b — Timers rethink) are an optional,
 * lightweight link to what the session was actually spent on, set when the
 * user picks a Task/Subtask from the Timers tab's own "what are you working
 * on?" picker when starting a timer — never the other way around (no button
 * on a Task/Subtask starts a Timers session; see ROADMAP.md). Both
 * `onDelete: 'set null'`, and `taskLabel` snapshots the picked title at link
 * time, so history/Dashboard stay readable even after the source Task is
 * renamed or deleted. All three are null for a timer with no link, or one
 * started from free text instead of picking a real Task/Subtask.
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
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  subtaskId: integer('subtask_id').references(() => subtasks.id, { onDelete: 'set null' }),
  taskLabel: text('task_label'),
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
 * One row per Task on the Tasks tab — a collapsible group with a title and
 * an explanation of what its Subtasks are (iteration 8, revised post-launch
 * — see ROADMAP.md's iteration 8 notes for the "hierarchy + priorities +
 * due dates + per-subtask timers" revision). Created either from an
 * approved AI Chat plan (POST /api/tasks, which batch-creates this row plus
 * its `subtasks` in one call) or by hand via the "Add Task" popup.
 * `conversationId` is nullable and `onDelete: 'set null'` — it links back
 * to the chat that produced this task (for the "go to chat" shortcut)
 * without making a task's lifetime depend on its source conversation still
 * existing; a manually-created task simply has no conversation to link.
 */
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  conversationId: integer('conversation_id').references(() => conversations.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'),
  dueDate: date('due_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * One row per checklist item within a Task. `estimatedMinutes` seeds
 * `remainingSeconds` on creation; unlike the original flat `tasks` table
 * (see git history), a subtask *does* carry a real, persisted timer —
 * `timerStatus`/`remainingSeconds`/`timerEndAt` mirror the Timers tab's
 * wall-clock technique (TimersTab.utils.ts's `computeRemainingSeconds`)
 * but persisted server-side instead of client-only, so a running subtask
 * timer survives a refresh or a device switch. `remainingSeconds` is only
 * authoritative while `timerStatus` is 'idle'/'paused'; while 'running',
 * the live remaining time is `timerEndAt - now`, recomputed client-side
 * every render tick — the server only ever writes on a start/pause/±minutes
 * action, never on a per-second tick.
 */
export const subtasks = pgTable(
  'subtasks',
  {
    id: serial('id').primaryKey(),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    estimatedMinutes: integer('estimated_minutes').notNull(),
    priority: text('priority').notNull().default('medium'),
    dueDate: date('due_date'),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    timerStatus: text('timer_status').notNull().default('idle'),
    remainingSeconds: integer('remaining_seconds').notNull(),
    timerEndAt: timestamp('timer_end_at', { withTimezone: true }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('subtasks_task_idx').on(table.taskId)],
)
