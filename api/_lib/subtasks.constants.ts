import { MAX_TASK_MINUTES, MIN_TASK_MINUTES } from './tasks.constants.js'

export { MAX_TASK_MINUTES, MIN_TASK_MINUTES }
export { MAX_TASK_TITLE_LENGTH } from './tasks.constants.js'

// Bounds a single addMinutes/subtractMinutes action — same order of
// magnitude as the Timers tab's ADD_MINUTES_STEP (5), but this is a request
// body value (the client sends the exact delta), not a fixed UI step, so it
// just needs sane outer bounds against a malformed/abusive payload.
export const MIN_MINUTES_DELTA = 1
export const MAX_MINUTES_DELTA = 60

// A subtask's remaining time never goes negative — clamped at 0 by both
// subtractMinutes and a timerAction 'start' racing past its own deadline.
export const MIN_REMAINING_SECONDS = 0
