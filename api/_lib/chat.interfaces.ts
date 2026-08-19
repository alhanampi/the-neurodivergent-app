import type { SupportedLanguage } from './preferences.interfaces.js'

export type ChatMessageRole = 'user' | 'assistant'

/** Body for POST /api/chat. `conversationId` is null for the first message
 * of a brand-new conversation (the handler creates one), or an existing
 * conversation's id to continue it. `language` drives which language the
 * system prompt instructs the assistant to answer in — the client always
 * sends its current i18n language, not something stored server-side, so a
 * language switch mid-conversation takes effect on the very next message. */
export interface ChatRequestBody {
  conversationId: number | null
  message: string
  language: SupportedLanguage
}

/** Wire shape written by api/chat.ts's SSE stream and read by
 * src/features/ai-chat/AiChatTab.interfaces.ts's duplicated client copy —
 * duplicated rather than shared, same convention as every other api/<->src/
 * boundary in this codebase (see TimersTab.interfaces.ts's comment on
 * TIMER_PRESET_IDS). `done`'s `title` is only present when this call
 * created a brand-new conversation, so the client can add it to the
 * sidebar without a separate re-fetch. */
export type ChatSseFrame =
  | { type: 'token'; value: string }
  | { type: 'done'; conversationId: number; messageId: number; title?: string }
  | { type: 'error'; message: string }
