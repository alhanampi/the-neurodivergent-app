import type { SubtaskRecord, TaskPriority } from './tasks.interfaces.js'

export type { SubtaskRecord }

/** Body for POST /api/subtasks — adds one subtask to an existing Task (the
 * "Add Subtask" popup). Batch-creation from an AI plan goes through
 * POST /api/tasks instead (see CreateTasksBody) — this is the single-item,
 * user-initiated path. */
export interface CreateSubtaskBody {
  taskId: number
  title: string
  minutes: number
  priority?: TaskPriority
  dueDate?: string | null
}

export type SubtaskTimerAction = 'start' | 'pause' | 'addMinutes' | 'subtractMinutes'

/** Body for PATCH /api/subtasks/[id] — a single flexible shape covering
 * both plain field edits and timer actions, since a real interaction (e.g.
 * tapping a subtask row) can plausibly do both in the same request (expand
 * + auto-start). At least one of the two groups must be present:
 * - Field edits: any of title/estimatedMinutes/priority/dueDate/completed.
 * - Timer action: `timerAction` (+ `minutesDelta` for the two minutes
 *   actions, ignored otherwise).
 */
export interface UpdateSubtaskBody {
  title?: string
  estimatedMinutes?: number
  priority?: TaskPriority
  dueDate?: string | null
  completed?: boolean
  timerAction?: SubtaskTimerAction
  minutesDelta?: number
}
