import { eq } from 'drizzle-orm'
import { Webhook } from 'svix'
import { db } from '../../db/client.js'
import { preferences, users } from '../../db/schema.js'
import type { VercelApiRequest } from '../vercel-http.interfaces.js'
import type { ClerkWebhookEvent, ClerkWebhookUserCreatedOrUpdated } from './clerk.interfaces.js'

function headerValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

/** Body parsing is disabled for this route (see clerk.ts) — svix needs the
 * exact raw bytes to verify the signature, not a re-serialized JSON string. */
export async function readRawBody(req: VercelApiRequest): Promise<string> {
  const chunks: Uint8Array[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Uint8Array))
  }
  return Buffer.concat(chunks).toString('utf8')
}

export function verifyClerkWebhook(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
): ClerkWebhookEvent {
  const webhook = new Webhook(secret)
  return webhook.verify(rawBody, {
    'svix-id': headerValue(headers['svix-id']),
    'svix-timestamp': headerValue(headers['svix-timestamp']),
    'svix-signature': headerValue(headers['svix-signature']),
  }) as ClerkWebhookEvent
}

export function getPrimaryEmail(user: ClerkWebhookUserCreatedOrUpdated): string | null {
  const primary = user.email_addresses.find((email) => email.id === user.primary_email_address_id)
  return primary?.email_address ?? user.email_addresses[0]?.email_address ?? null
}

/** Upserts the user row and makes sure a preferences row exists (defaults
 * to 'en' — the real value gets set the first time they touch Settings, or
 * synced down from whatever they already had in localStorage). */
export async function upsertUser(user: ClerkWebhookUserCreatedOrUpdated): Promise<void> {
  const email = getPrimaryEmail(user)
  if (!email) return

  await db.insert(users).values({ id: user.id, email }).onConflictDoUpdate({
    target: users.id,
    set: { email },
  })

  await db.insert(preferences).values({ userId: user.id }).onConflictDoNothing({
    target: preferences.userId,
  })
}

export async function deleteUser(userId: string): Promise<void> {
  // preferences cascades via its FK's onDelete: 'cascade'
  await db.delete(users).where(eq(users.id, userId))
}
