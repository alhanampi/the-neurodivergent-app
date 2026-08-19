// Bounds shared with the server (api/_lib/tasks.constants.ts /
// api/_lib/subtasks.constants.ts) — duplicated client-side per this
// codebase's api/<->src/ convention (see TasksTab.interfaces.ts's comment).
export const MIN_SUBTASK_MINUTES = 1
export const MAX_SUBTASK_MINUTES = 180
export const MAX_TASK_TITLE_LENGTH = 120
export const MAX_TASK_DESCRIPTION_LENGTH = 500

// Applied by a subtask timer panel's +/- buttons — same value/spirit as the
// Timers tab's own ADD_MINUTES_STEP (TimersTab.constants.ts), kept as a
// separate constant since the two features don't share config.
export const SUBTASK_MINUTES_STEP = 5

// Re-render cadence for a running subtask's live countdown — coarser than
// the Timers tab's 250ms (TICK_INTERVAL_MS there) since this only drives a
// MM:SS label, not a tightly-synced progress bar.
export const SUBTASK_TICK_INTERVAL_MS = 1000

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const
export const DEFAULT_TASK_PRIORITY = 'medium'
