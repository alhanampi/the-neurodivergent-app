/** Priority shared by both tasks and subtasks — plain text column in
 * Postgres (not a pg enum), same "UI config, not a DB invariant" reasoning
 * TimersTab.constants.ts's preset ids already use. */
export type TaskPriority = 'low' | 'medium' | 'high'

/** A Task as it comes back from GET/POST /api/tasks — a collapsible group
 * with a title/description explaining what its `subtasks` are.
 * `conversationId` is the chat conversation this task was generated from,
 * or null for a manually-created task (see db/schema.ts's doc comment). */
export interface TaskRecord {
  id: number
  conversationId: number | null
  title: string
  description: string | null
  priority: TaskPriority
  dueDate: string | null
  createdAt: string
  subtasks: SubtaskRecord[]
}

/** One checklist item within a Task — see db/schema.ts's doc comment on
 * `subtasks` for the timer field semantics. */
export interface SubtaskRecord {
  id: number
  taskId: number
  title: string
  estimatedMinutes: number
  priority: TaskPriority
  dueDate: string | null
  completed: boolean
  completedAt: string | null
  timerStatus: 'idle' | 'running' | 'paused'
  remainingSeconds: number
  timerEndAt: string | null
  sortOrder: number
  createdAt: string
}

/** One step of a batch-create body — either an AI Chat plan's steps or a
 * manually-added subtask. Deliberately doesn't import chat-plan's PlanStep
 * (same "tasks.ts has no dependency on the chat feature" decoupling as
 * before) even though the shapes overlap. */
export interface CreateTaskStep {
  title: string
  minutes: number
  priority: TaskPriority
  dueDate: string | null
}

/** Body for POST /api/tasks — creates one Task plus 0+ subtasks in a single
 * batch. `steps: []` is how the "Add Task" popup creates an empty group
 * (subtasks are added afterward via POST /api/subtasks); a non-empty
 * `steps` is how an approved AI Chat plan becomes real rows. */
export interface CreateTasksBody {
  title: string
  description: string | null
  priority: TaskPriority
  dueDate: string | null
  conversationId: number | null
  steps: CreateTaskStep[]
}

/** Body for PATCH /api/tasks/[id] — partial edit of the Task's own fields
 * (never its subtasks, which go through /api/subtasks/[id]). At least one
 * field must be present. */
export interface UpdateTaskBody {
  title?: string
  description?: string | null
  priority?: TaskPriority
  dueDate?: string | null
}
