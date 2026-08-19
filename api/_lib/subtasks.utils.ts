import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { subtasks, tasks } from '../../db/schema.js'
import { parseDueDate, parseTaskPriority } from './tasks.utils.js'
import {
  MAX_MINUTES_DELTA,
  MAX_TASK_MINUTES,
  MAX_TASK_TITLE_LENGTH,
  MIN_MINUTES_DELTA,
  MIN_REMAINING_SECONDS,
  MIN_TASK_MINUTES,
} from './subtasks.constants.js'
import type {
  CreateSubtaskBody,
  SubtaskRecord,
  SubtaskTimerAction,
  UpdateSubtaskBody,
} from './subtasks.interfaces.js'
import type { TaskPriority } from './tasks.interfaces.js'

export function parseCreateSubtaskBody(body: unknown): CreateSubtaskBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>

  if (
    typeof candidate.taskId !== 'number' ||
    !Number.isInteger(candidate.taskId) ||
    candidate.taskId <= 0
  ) {
    return null
  }

  if (typeof candidate.title !== 'string') return null
  const title = candidate.title.trim()
  if (title.length === 0 || title.length > MAX_TASK_TITLE_LENGTH) return null

  if (typeof candidate.minutes !== 'number' || !Number.isFinite(candidate.minutes)) return null
  const minutes = Math.round(candidate.minutes)
  if (minutes < MIN_TASK_MINUTES || minutes > MAX_TASK_MINUTES) return null

  const priority = parseTaskPriority(candidate.priority)
  if (!priority) return null

  const dueDate = candidate.dueDate === undefined ? null : parseDueDate(candidate.dueDate)
  if (candidate.dueDate !== undefined && dueDate === null && candidate.dueDate !== null) {
    return null
  }

  return { taskId: candidate.taskId, title, minutes, priority, dueDate }
}

const TIMER_ACTIONS: readonly SubtaskTimerAction[] = [
  'start',
  'pause',
  'addMinutes',
  'subtractMinutes',
]

/** Validates a PATCH /api/subtasks/[id] body — field edits, a timer action,
 * or both in one request. Returns null if nothing valid is present, or if a
 * present field fails its own bounds. */
export function parseUpdateSubtaskBody(body: unknown): UpdateSubtaskBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>
  const result: UpdateSubtaskBody = {}
  let hasField = false

  if (candidate.title !== undefined) {
    if (typeof candidate.title !== 'string') return null
    const title = candidate.title.trim()
    if (title.length === 0 || title.length > MAX_TASK_TITLE_LENGTH) return null
    result.title = title
    hasField = true
  }

  if (candidate.estimatedMinutes !== undefined) {
    if (
      typeof candidate.estimatedMinutes !== 'number' ||
      !Number.isFinite(candidate.estimatedMinutes)
    ) {
      return null
    }
    const minutes = Math.round(candidate.estimatedMinutes)
    if (minutes < MIN_TASK_MINUTES || minutes > MAX_TASK_MINUTES) return null
    result.estimatedMinutes = minutes
    hasField = true
  }

  if (candidate.priority !== undefined) {
    const priority = parseTaskPriority(candidate.priority)
    if (!priority) return null
    result.priority = priority
    hasField = true
  }

  if (candidate.dueDate !== undefined) {
    const dueDate = parseDueDate(candidate.dueDate)
    if (dueDate === null && candidate.dueDate !== null) return null
    result.dueDate = dueDate
    hasField = true
  }

  if (candidate.completed !== undefined) {
    if (typeof candidate.completed !== 'boolean') return null
    result.completed = candidate.completed
    hasField = true
  }

  if (candidate.timerAction !== undefined) {
    if (
      typeof candidate.timerAction !== 'string' ||
      !TIMER_ACTIONS.includes(candidate.timerAction as SubtaskTimerAction)
    ) {
      return null
    }
    result.timerAction = candidate.timerAction as SubtaskTimerAction

    if (result.timerAction === 'addMinutes' || result.timerAction === 'subtractMinutes') {
      if (typeof candidate.minutesDelta !== 'number' || !Number.isFinite(candidate.minutesDelta)) {
        return null
      }
      const delta = Math.round(candidate.minutesDelta)
      if (delta < MIN_MINUTES_DELTA || delta > MAX_MINUTES_DELTA) return null
      result.minutesDelta = delta
    }
    hasField = true
  }

  return hasField ? result : null
}

function toSubtaskRecord(row: typeof subtasks.$inferSelect): SubtaskRecord {
  return {
    id: row.id,
    taskId: row.taskId,
    title: row.title,
    estimatedMinutes: row.estimatedMinutes,
    priority: row.priority as TaskPriority,
    dueDate: row.dueDate,
    completed: row.completed,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    timerStatus: row.timerStatus as SubtaskRecord['timerStatus'],
    remainingSeconds: row.remainingSeconds,
    timerEndAt: row.timerEndAt ? row.timerEndAt.toISOString() : null,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  }
}

/** Verifies `taskId` belongs to `userId`, then inserts the subtask —
 * separate ownership check (rather than a single INSERT ... SELECT) since
 * `neon-http` doesn't give us a transaction to wrap both in anyway (see
 * ROADMAP's accepted-risk note on the chat write sequence for the same
 * tradeoff elsewhere in this codebase). */
export async function createSubtaskOwned(
  userId: string,
  body: CreateSubtaskBody,
): Promise<SubtaskRecord | null> {
  const [taskRow] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, body.taskId), eq(tasks.userId, userId)))
    .limit(1)
  if (!taskRow) return null

  // Next sortOrder is just "how many subtasks this task already has" — new
  // ones always append to the end of the list.
  const existingSubtasks = await db
    .select({ id: subtasks.id })
    .from(subtasks)
    .where(eq(subtasks.taskId, body.taskId))

  const [row] = await db
    .insert(subtasks)
    .values({
      taskId: body.taskId,
      title: body.title,
      estimatedMinutes: body.minutes,
      priority: body.priority ?? 'medium',
      dueDate: body.dueDate ?? null,
      remainingSeconds: body.minutes * 60,
      sortOrder: existingSubtasks.length,
    })
    .returning()

  return toSubtaskRecord(row)
}

/** Ownership is enforced via an inner join on the WHERE clause — a subtask
 * belonging to someone else's task looks identical to a nonexistent one
 * (both return null), same IDOR-safe shape as tasks.utils.ts's
 * updateTaskOwned/deleteTaskOwned. Field edits and a timer action can be
 * applied in the same call; timer-action math (start/pause/±minutes) is
 * computed from the row's current state, read in this same query. */
export async function updateSubtaskOwned(
  userId: string,
  subtaskId: number,
  body: UpdateSubtaskBody,
): Promise<SubtaskRecord | null> {
  const rows = await db
    .select({ subtask: subtasks })
    .from(subtasks)
    .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
    .where(and(eq(subtasks.id, subtaskId), eq(tasks.userId, userId)))
    .limit(1)
  const current = rows[0]?.subtask
  if (!current) return null

  const patch: Partial<typeof subtasks.$inferInsert> = {}

  if (body.title !== undefined) patch.title = body.title
  if (body.estimatedMinutes !== undefined) patch.estimatedMinutes = body.estimatedMinutes
  if (body.priority !== undefined) patch.priority = body.priority
  if (body.dueDate !== undefined) patch.dueDate = body.dueDate
  if (body.completed !== undefined) {
    patch.completed = body.completed
    patch.completedAt = body.completed ? new Date() : null
  }

  if (body.timerAction) {
    const now = new Date()
    const liveRemainingSeconds =
      current.timerStatus === 'running' && current.timerEndAt
        ? Math.max(
            MIN_REMAINING_SECONDS,
            Math.round((current.timerEndAt.getTime() - now.getTime()) / 1000),
          )
        : current.remainingSeconds

    if (body.timerAction === 'start') {
      patch.timerStatus = 'running'
      patch.remainingSeconds = liveRemainingSeconds
      patch.timerEndAt = new Date(now.getTime() + liveRemainingSeconds * 1000)
    } else if (body.timerAction === 'pause') {
      patch.timerStatus = 'paused'
      patch.remainingSeconds = liveRemainingSeconds
      patch.timerEndAt = null
    } else {
      // addMinutes / subtractMinutes — adjust remainingSeconds, and if
      // currently running, shift timerEndAt by the same delta so the live
      // countdown keeps reflecting it immediately.
      const deltaSeconds = (body.minutesDelta ?? 0) * 60
      const signedDelta = body.timerAction === 'subtractMinutes' ? -deltaSeconds : deltaSeconds
      const nextRemaining = Math.max(MIN_REMAINING_SECONDS, liveRemainingSeconds + signedDelta)
      patch.remainingSeconds = nextRemaining
      patch.timerEndAt =
        current.timerStatus === 'running' ? new Date(now.getTime() + nextRemaining * 1000) : null
    }
  }

  const [updated] = await db
    .update(subtasks)
    .set(patch)
    .where(eq(subtasks.id, subtaskId))
    .returning()
  return updated ? toSubtaskRecord(updated) : null
}

export async function deleteSubtaskOwned(userId: string, subtaskId: number): Promise<boolean> {
  const rows = await db
    .select({ id: subtasks.id })
    .from(subtasks)
    .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
    .where(and(eq(subtasks.id, subtaskId), eq(tasks.userId, userId)))
    .limit(1)
  if (!rows[0]) return false

  await db.delete(subtasks).where(eq(subtasks.id, subtaskId))
  return true
}
