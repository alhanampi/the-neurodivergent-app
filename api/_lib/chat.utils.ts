import { asc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { conversations, messages } from '../../db/schema.js'
import { isSupportedLanguage } from './preferences.utils.js'
import { CONVERSATION_TITLE_MAX_LENGTH, MAX_MESSAGE_LENGTH } from './chat.constants.js'
import type { ChatMessageRole, ChatRequestBody, ChatSseFrame } from './chat.interfaces.js'
import type { VercelApiResponse } from './vercel-http.interfaces.js'
import type { SupportedLanguage } from './preferences.interfaces.js'

/** Validates an untrusted request body into a well-formed chat request, or
 * returns null if anything about it doesn't check out — same hand-guard
 * style as timer-sessions.utils.ts's parseCreateTimerSessionBody, no
 * validation library. */
export function parseChatRequestBody(body: unknown): ChatRequestBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>

  if (candidate.conversationId !== null) {
    if (
      typeof candidate.conversationId !== 'number' ||
      !Number.isInteger(candidate.conversationId) ||
      candidate.conversationId <= 0
    ) {
      return null
    }
  }

  if (typeof candidate.message !== 'string') return null
  const trimmedMessage = candidate.message.trim()
  if (trimmedMessage.length === 0 || trimmedMessage.length > MAX_MESSAGE_LENGTH) return null

  if (!isSupportedLanguage(candidate.language)) return null

  return {
    conversationId: candidate.conversationId as number | null,
    message: trimmedMessage,
    language: candidate.language,
  }
}

/** A brand-new conversation's title: trim, collapse internal whitespace,
 * truncate to CONVERSATION_TITLE_MAX_LENGTH with an ellipsis. Falls back to
 * a generic title for the (practically unreachable, message is already
 * validated non-empty by parseChatRequestBody) empty-after-trim case. */
export function deriveConversationTitle(message: string): string {
  const collapsed = message.trim().replace(/\s+/g, ' ')
  if (collapsed.length === 0) return 'New conversation'
  return collapsed.length > CONVERSATION_TITLE_MAX_LENGTH
    ? `${collapsed.slice(0, CONVERSATION_TITLE_MAX_LENGTH)}…`
    : collapsed
}

// Exported so chat-plan.utils.ts's buildPlanSystemPrompt can reuse it
// without duplicating the language-name mapping.
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
}

/** The task-breakdown persona, per ROADMAP.md's iteration 8 requirement:
 * warm/encouraging/non-judgmental, asks clarifying questions before
 * proposing a plan, never scolds. Rebuilt fresh on every request (never
 * persisted as a message row) so it always reflects the caller's *current*
 * UI language, not whatever was active when the conversation started. */
export function buildSystemPrompt(language: SupportedLanguage): string {
  return `You are a warm, encouraging, and non-judgmental assistant inside a productivity app built for neurodivergent people. Your job is to help the person break down a task — including everyday or domestic tasks like "clean the kitchen" or "reply to that email" — into small, concrete, non-overwhelming steps.

Guidelines:
- Never scold, guilt-trip, or imply the person should already know how to do this. Assume good faith and that starting is genuinely hard sometimes.
- Before proposing a full plan, ask 1-2 short clarifying questions if the task is vague or you're missing something that would change the steps (how much time they have, what they already have on hand, what "done" looks like). Skip clarifying questions if the task is already specific enough to break down directly.
- When you do propose steps, keep each one small and concrete — something that takes a few minutes and has an obvious "I did this" endpoint, not a vague phase. Estimate the REAL time each step takes for an average person — including setup, cleanup, and normal friction — never the fastest theoretical case, and never shrink an estimate just to make it sound achievable. Do the arithmetic explicitly for anything distance/quantity-based rather than guessing a round number — e.g. walking somewhere: ~2 minutes per city block at a normal pace, and a round trip is there AND back (5 blocks each way is ~20 minutes total, not 10), plus time actually spent once there and time to gather/put on anything needed before leaving.
- If the person tells you how much time they have available, sanity-check it against what the task actually requires before going along with it. If it's realistically not enough, say so plainly and kindly — don't silently propose a plan that pretends it fits. Offer concrete options instead: doing a smaller/partial version now, extending the time, or splitting the task across more than one session. Frame this as helpful realism, not criticism of their estimate.
- Keep your tone conversational and brief. Avoid long paragraphs, clinical language, or a lecture-y tone.
- Format with plain Markdown only — headings, bold, and bullet/numbered lists for steps. Never use raw HTML tags (e.g. "<br>", "<table>") — they render as literal text, not formatting, and will show up broken. Prefer a bullet or numbered list over a Markdown table for a step-by-step breakdown; if you do use a table, keep every cell to one short line, since cells can't contain line breaks.
- Respond only in ${LANGUAGE_NAMES[language]}, regardless of what language this instruction is written in.`
}

export function writeSseFrame(res: VercelApiResponse, frame: ChatSseFrame): void {
  res.write(`data: ${JSON.stringify(frame)}\n\n`)
}

export async function createConversation(userId: string, title: string): Promise<number> {
  const [row] = await db
    .insert(conversations)
    .values({ userId, title })
    .returning({ id: conversations.id })
  return row.id
}

export async function insertUserMessage(conversationId: number, content: string): Promise<void> {
  await db.insert(messages).values({ conversationId, role: 'user', content })
}

/** Inserted only after the Groq stream completes successfully — see
 * ROADMAP.md's iteration 8 notes on write sequencing (the user's message is
 * always saved first, before calling Groq, so a Groq failure never loses
 * what they typed; the assistant's reply literally can't exist before the
 * stream finishes). Returns the new row's id for the SSE 'done' frame. */
export async function insertAssistantMessage(
  conversationId: number,
  content: string,
): Promise<number> {
  const [row] = await db
    .insert(messages)
    .values({ conversationId, role: 'assistant', content })
    .returning({ id: messages.id })
  return row.id
}

export async function touchConversation(conversationId: number): Promise<void> {
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))
}

/** Full ordered history for a conversation, mapped to the plain
 * {role, content} shape both api/chat.ts and api/chat-plan.ts prepend a
 * system prompt to before calling Groq. */
export async function fetchConversationHistory(
  conversationId: number,
): Promise<{ role: ChatMessageRole; content: string }[]> {
  const rows = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  return rows.map((row) => ({ role: row.role as ChatMessageRole, content: row.content }))
}
