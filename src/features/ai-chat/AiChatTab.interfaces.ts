// Deliberately duplicated from api/chat.interfaces.ts /
// api/conversations.interfaces.ts rather than importing across the
// client/server boundary — same convention as TimersTab.interfaces.ts's own
// TIMER_PRESET_IDS.
export type ChatMessageRole = 'user' | 'assistant'

export interface ClientMessage {
  id: number
  role: ChatMessageRole
  content: string
  createdAt: string
}

export interface ConversationSummary {
  id: number
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

/** Wire shape read from api/chat.ts's SSE stream — see AiChatTab.utils.ts's
 * parseSseChunk/isChatSseFrame for how a raw chunk becomes one of these. */
export type ChatSseFrame =
  | { type: 'token'; value: string }
  | { type: 'done'; conversationId: number; messageId: number; title?: string }
  | { type: 'error'; message: string }

/** One heading in the sidebar's date-grouped conversation list — see
 * AiChatTab.utils.ts's groupConversationsByDate. */
export interface ConversationDateGroup {
  labelKey: string
  conversations: ConversationSummary[]
}

/** A locally-editable plan step, before it's confirmed and sent to Tasks.
 * `id` is a client-only crypto.randomUUID() for React keys/editing — never
 * persisted (a confirmed step becomes a plain {title, minutes} in the
 * POST /api/tasks body). */
export interface PlanStepDraft {
  id: string
  title: string
  minutes: number
}

/** PUT /api/conversations/[id]'s response — lighter than
 * ConversationSummary (no messageCount, a rename never changes it). See
 * api/conversations.interfaces.ts's own copy of this type. */
export interface RenamedConversation {
  id: number
  title: string
  updatedAt: string
}
