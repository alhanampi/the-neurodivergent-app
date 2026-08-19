/** Sanity ceiling on one chat message's length — not a product limit anyone
 * writing a real message would hit, just a guard against a malformed or
 * abusive payload before it reaches Groq. Mirrored client-side
 * (AiChatTab.constants.ts) as the composer's maxLength. */
export const MAX_MESSAGE_LENGTH = 4000

/** A brand-new conversation's title is derived from the first user message
 * (see deriveConversationTitle) rather than a second Groq call asking it to
 * summarize itself — saves latency and Groq spend, and removes a whole
 * failure mode (a title-generation call failing shouldn't block sending the
 * user's actual message). */
export const CONVERSATION_TITLE_MAX_LENGTH = 48

export const CHAT_TEMPERATURE = 0.6
export const CHAT_MAX_TOKENS = 2048
