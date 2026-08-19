/** A checklist item as it comes back from GET/POST /api/tasks —
 * `estimatedMinutes` is a display label only, never a running timer (see
 * db/schema.ts's doc comment on the `tasks` table for why). */
export interface TaskRecord {
  id: number
  title: string
  estimatedMinutes: number
  completed: boolean
  createdAt: string
  completedAt: string | null
}

/** Body for POST /api/tasks — a batch of steps approved from an AI Chat
 * plan (see PlanStep in chat-plan.interfaces.ts, which this deliberately
 * doesn't import — tasks.ts has no dependency on the chat feature, it just
 * happens to receive data shaped the same way). */
export interface CreateTasksBody {
  steps: { title: string; minutes: number }[]
}

export interface UpdateTaskBody {
  completed: boolean
}
