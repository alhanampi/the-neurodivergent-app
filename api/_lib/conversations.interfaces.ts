import type { ChatMessageRole } from './chat.interfaces.js'

export const MAX_CONVERSATION_TITLE_LENGTH = 120

/** One row of the AI Chat sidebar's conversation list — GET
 * /api/conversations. `messageCount` lets the client show something
 * without a second round trip; the messages themselves are only fetched
 * once a conversation is actually opened (GET /api/conversations/[id]). */
export interface ConversationSummary {
  id: number
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

/** One turn as it comes back from GET /api/conversations/[id]. */
export interface ClientMessage {
  id: number
  role: ChatMessageRole
  content: string
  createdAt: string
}

export interface RenameConversationBody {
  title: string
}

/** PUT /api/conversations/[id]'s response — deliberately lighter than
 * ConversationSummary (no messageCount): a rename never changes the
 * message count, so the client just patches these three fields onto its
 * already-known sidebar entry instead of this route doing a wasted extra
 * count query. */
export interface RenamedConversation {
  id: number
  title: string
  updatedAt: string
}
