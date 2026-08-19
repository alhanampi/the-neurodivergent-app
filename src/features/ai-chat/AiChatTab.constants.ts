// Mirrors api/chat.constants.ts's MAX_MESSAGE_LENGTH — used as the
// composer's maxLength so the user sees the limit before hitting a 400.
export const MAX_MESSAGE_LENGTH = 4000

// Gates the "Convert to plan" button — converting a single message with no
// back-and-forth into a "plan" isn't a meaningful action yet.
export const MIN_MESSAGES_FOR_PLAN = 2

// localStorage key remembering the last active conversation, so leaving the
// AI Chat tab (which unmounts it — a route change, not a hide/show) and
// coming back restores the same conversation instead of dropping to a blank
// new chat. Same naming convention as TimersTab.constants.ts's
// TIMER_SOUND_STORAGE_KEY.
export const LAST_CONVERSATION_STORAGE_KEY = 'nd-app:ai-chat:last-conversation-id'
