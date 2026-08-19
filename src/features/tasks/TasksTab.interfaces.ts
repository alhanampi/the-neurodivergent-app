// Deliberately duplicated from api/_lib/tasks.interfaces.ts /
// api/_lib/subtasks.interfaces.ts rather than importing across the
// client/server boundary — same convention as every other api/<->src/
// boundary in this codebase (see TimersTab.interfaces.ts's own comment on
// TIMER_PRESET_IDS).
export type TaskPriority = 'low' | 'medium' | 'high'

export type SubtaskTimerStatus = 'idle' | 'running' | 'paused'

export type SubtaskTimerAction = 'start' | 'pause' | 'addMinutes' | 'subtractMinutes'

/** A checklist item within a Task — see db/schema.ts's doc comment on
 * `subtasks` for the timer field semantics. `remainingSeconds` is only
 * authoritative while `timerStatus` is 'idle'/'paused'; while 'running',
 * the live remaining time is derived from `timerEndAt` client-side every
 * render tick (see TasksTab.utils.ts's computeLiveRemainingSeconds). */
export interface SubtaskRecord {
  id: number
  taskId: number
  title: string
  estimatedMinutes: number
  priority: TaskPriority
  dueDate: string | null
  completed: boolean
  completedAt: string | null
  timerStatus: SubtaskTimerStatus
  remainingSeconds: number
  timerEndAt: string | null
  sortOrder: number
  createdAt: string
}

/** A Task — a collapsible group with a title/description explaining what
 * its `subtasks` are. `conversationId` links back to the AI Chat
 * conversation this task was generated from (for the "go to chat"
 * shortcut), or is null for a manually-created task. */
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
