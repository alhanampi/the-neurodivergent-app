import { and, asc, count, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { conversations, messages } from '../../db/schema.js'
import { MAX_CONVERSATION_TITLE_LENGTH } from './conversations.interfaces.js'
import type {
  ClientMessage,
  ConversationSummary,
  RenameConversationBody,
  RenamedConversation,
} from './conversations.interfaces.js'
import type { ChatMessageRole } from './chat.interfaces.js'

/** Sanity ceiling on how many conversations the sidebar lists — not a
 * product limit anyone would realistically hit through normal use, same
 * spirit as HISTORY_LIMIT in timer-sessions.utils.ts. */
const CONVERSATION_LIST_LIMIT = 100

/** Shared ownership check — used by chat.ts, chat-plan.ts, and
 * conversations/[id].ts before reading/writing/deleting anything, so a
 * conversation id belonging to a different user always 404s instead of
 * leaking whether it exists (IDOR prevention). */
export async function getOwnedConversation(
  userId: string,
  conversationId: number,
): Promise<{ id: number; title: string } | null> {
  const [row] = await db
    .select({ id: conversations.id, title: conversations.title })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1)

  return row ?? null
}

export async function listConversationsForUser(userId: string): Promise<ConversationSummary[]> {
  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: count(messages.id),
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, userId))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt))
    .limit(CONVERSATION_LIST_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messageCount: Number(row.messageCount),
  }))
}

export async function listMessagesForConversation(
  conversationId: number,
): Promise<ClientMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  return rows.map((row) => ({
    id: row.id,
    role: row.role as ChatMessageRole,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function renameConversation(
  userId: string,
  conversationId: number,
  title: string,
): Promise<RenamedConversation | null> {
  const [row] = await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .returning({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
    })

  if (!row) return null
  return { id: row.id, title: row.title, updatedAt: row.updatedAt.toISOString() }
}

export async function deleteConversationOwned(
  userId: string,
  conversationId: number,
): Promise<boolean> {
  const result = await db
    .delete(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .returning({ id: conversations.id })

  return result.length > 0
}

export function parseRenameBody(body: unknown): RenameConversationBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>
  if (typeof candidate.title !== 'string') return null

  const trimmed = candidate.title.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_CONVERSATION_TITLE_LENGTH) return null

  return { title: trimmed }
}
