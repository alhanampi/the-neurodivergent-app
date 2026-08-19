// Mirrors api/chat.constants.ts's MAX_MESSAGE_LENGTH — used as the
// composer's maxLength so the user sees the limit before hitting a 400.
export const MAX_MESSAGE_LENGTH = 4000

// Gates the "Convert to plan" button — converting a single message with no
// back-and-forth into a "plan" isn't a meaningful action yet.
export const MIN_MESSAGES_FOR_PLAN = 2
