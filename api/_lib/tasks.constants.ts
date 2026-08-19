export const MAX_TASK_TITLE_LENGTH = 120
// Matches chat-plan.constants.ts's MAX_TASK_DESCRIPTION_LENGTH — an
// AI-generated description (a real breakdown of what each step requires,
// not just a one-line summary) must fit within what POST /api/tasks accepts.
export const MAX_TASK_DESCRIPTION_LENGTH = 800
export const MIN_TASK_MINUTES = 1
export const MAX_TASK_MINUTES = 180

// Matches chat-plan.constants.ts's MAX_PLAN_STEPS — a batch-created subtask
// list traces back to one approved plan, which is capped the same way.
export const MAX_TASKS_PER_REQUEST = 12

// Sanity ceiling on the tasks list — not a product limit anyone doing
// personal task tracking would realistically hit, same convention as
// HISTORY_LIMIT/DASHBOARD_QUERY_LIMIT in timer-sessions.utils.ts.
export const TASKS_LIST_LIMIT = 200

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const
export const DEFAULT_TASK_PRIORITY = 'medium'
