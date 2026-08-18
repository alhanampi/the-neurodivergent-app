import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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
