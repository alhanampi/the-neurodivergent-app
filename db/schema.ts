import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

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
