import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { conversations, subtasks, tasks } from '../../db/schema.js'
import {
  DEFAULT_TASK_PRIORITY,
  MAX_TASKS_PER_REQUEST,
  MAX_TASK_DESCRIPTION_LENGTH,
  MAX_TASK_MINUTES,
  MAX_TASK_TITLE_LENGTH,
  MIN_TASK_MINUTES,
  TASKS_LIST_LIMIT,
  TASK_PRIORITIES,
} from './tasks.constants.js'
import type {
  CreateTasksBody,
  CreateTaskStep,
  SubtaskRecord,
  TaskPriority,
  TaskRecord,
  UpdateTaskBody,
} from './tasks.interfaces.js'

// YYYY-MM-DD only — matches the `date` Postgres column and the native
// <input type="date"> the client sends (see docs/plan's "no
// @mui/x-date-pickers" decision). Deliberately not a full ISO-datetime
// parse; a due date has no time-of-day component in this app.
const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Shared by tasks.utils.ts and subtasks.utils.ts — both Task and Subtask
 * carry the same priority vocabulary. Returns the default on `undefined`
 * (field omitted), null on anything actually invalid. */
export function parseTaskPriority(value: unknown): TaskPriority | null {
  if (value === undefined) return DEFAULT_TASK_PRIORITY
  if (typeof value !== 'string') return null
  return (TASK_PRIORITIES as readonly string[]).includes(value) ? (value as TaskPriority) : null
}

/** Same shared-validator reasoning as parseTaskPriority. `null` is a valid
 * "no due date" value distinct from `undefined` (field omitted, meaning
 * "don't change it" on a PATCH) — callers that need to distinguish those
 * two do so before calling this. */
export function parseDueDate(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || !DUE_DATE_PATTERN.test(value)) return null
  return value
}

function normalizeTaskStep(value: unknown): CreateTaskStep | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>

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

  return { title, minutes, priority, dueDate }
}

/** Validates a batch-create body — either an approved AI Chat plan's steps
 * (non-empty) or a manually-added Task with no subtasks yet (`steps: []`).
 * Same hand-guard style as every other untrusted-input parser in this
 * codebase, no validation library. */
export function parseCreateTasksBody(body: unknown): CreateTasksBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>

  if (typeof candidate.title !== 'string') return null
  const title = candidate.title.trim()
  if (title.length === 0 || title.length > MAX_TASK_TITLE_LENGTH) return null

  let description: string | null = null
  if (candidate.description !== undefined && candidate.description !== null) {
    if (typeof candidate.description !== 'string') return null
    const trimmed = candidate.description.trim()
    if (trimmed.length > MAX_TASK_DESCRIPTION_LENGTH) return null
    description = trimmed.length > 0 ? trimmed : null
  }

  const priority = parseTaskPriority(candidate.priority)
  if (!priority) return null

  const dueDate = candidate.dueDate === undefined ? null : parseDueDate(candidate.dueDate)
  if (candidate.dueDate !== undefined && dueDate === null && candidate.dueDate !== null) {
    return null
  }

  let conversationId: number | null = null
  if (candidate.conversationId !== undefined && candidate.conversationId !== null) {
    if (
      typeof candidate.conversationId !== 'number' ||
      !Number.isInteger(candidate.conversationId) ||
      candidate.conversationId <= 0
    ) {
      return null
    }
    conversationId = candidate.conversationId
  }

  if (!Array.isArray(candidate.steps)) return null
  if (candidate.steps.length > MAX_TASKS_PER_REQUEST) return null

  const steps: CreateTaskStep[] = []
  for (const rawStep of candidate.steps) {
    const step = normalizeTaskStep(rawStep)
    if (!step) return null
    steps.push(step)
  }

  return { title, description, priority, dueDate, conversationId, steps }
}

/** Partial edit of a Task's own fields — at least one must be present. */
export function parseUpdateTaskBody(body: unknown): UpdateTaskBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>
  const result: UpdateTaskBody = {}
  let hasField = false

  if (candidate.title !== undefined) {
    if (typeof candidate.title !== 'string') return null
    const title = candidate.title.trim()
    if (title.length === 0 || title.length > MAX_TASK_TITLE_LENGTH) return null
    result.title = title
    hasField = true
  }

  if (candidate.description !== undefined) {
    if (candidate.description !== null && typeof candidate.description !== 'string') return null
    if (typeof candidate.description === 'string') {
      const trimmed = candidate.description.trim()
      if (trimmed.length > MAX_TASK_DESCRIPTION_LENGTH) return null
      result.description = trimmed.length > 0 ? trimmed : null
    } else {
      result.description = null
    }
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

function toTaskRecord(
  row: typeof tasks.$inferSelect,
  subtaskRows: (typeof subtasks.$inferSelect)[],
): TaskRecord {
  return {
    id: row.id,
    conversationId: row.conversationId,
    title: row.title,
    description: row.description,
    priority: row.priority as TaskPriority,
    dueDate: row.dueDate,
    createdAt: row.createdAt.toISOString(),
    subtasks: subtaskRows.map(toSubtaskRecord),
  }
}

/** Newest task first; subtasks within a task keep their `sortOrder`, then
 * creation order. Two queries (no FK-following join) since `neon-http` has
 * no transactions and this codebase already accepts that tradeoff
 * elsewhere (see ROADMAP's chat-write-sequence note) — grouped in JS. */
export async function listTasksForUser(userId: string): Promise<TaskRecord[]> {
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt))
    .limit(TASKS_LIST_LIMIT)

  if (taskRows.length === 0) return []

  const taskIds = taskRows.map((row) => row.id)
  const subtaskRows = await db
    .select()
    .from(subtasks)
    .where(inArray(subtasks.taskId, taskIds))
    .orderBy(asc(subtasks.sortOrder), asc(subtasks.createdAt))

  const subtasksByTaskId = new Map<number, (typeof subtasks.$inferSelect)[]>()
  for (const row of subtaskRows) {
    const bucket = subtasksByTaskId.get(row.taskId)
    if (bucket) bucket.push(row)
    else subtasksByTaskId.set(row.taskId, [row])
  }

  return taskRows.map((row) => toTaskRecord(row, subtasksByTaskId.get(row.id) ?? []))
}

/** Creates one Task plus its 0+ subtasks. Ownership of `conversationId` is
 * intentionally NOT verified against the caller here — see api/tasks.ts,
 * which resolves/validates it before calling this. */
export async function createTaskWithSubtasks(
  userId: string,
  body: CreateTasksBody,
): Promise<TaskRecord> {
  const [taskRow] = await db
    .insert(tasks)
    .values({
      userId,
      conversationId: body.conversationId ?? null,
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? DEFAULT_TASK_PRIORITY,
      dueDate: body.dueDate ?? null,
    })
    .returning()

  if (body.steps.length === 0) return toTaskRecord(taskRow, [])

  const subtaskRows = await db
    .insert(subtasks)
    .values(
      body.steps.map((step, index) => ({
        taskId: taskRow.id,
        title: step.title,
        estimatedMinutes: step.minutes,
        priority: step.priority ?? DEFAULT_TASK_PRIORITY,
        dueDate: step.dueDate ?? null,
        remainingSeconds: step.minutes * 60,
        sortOrder: index,
      })),
    )
    .returning()

  return toTaskRecord(taskRow, subtaskRows)
}

/** Ownership is enforced directly in the WHERE clause (userId + id both
 * required to match) rather than via a separate pre-check query — an
 * update/delete that matches zero rows because the task belongs to someone
 * else looks identical to one that matches zero rows because the id
 * doesn't exist, which is exactly the IDOR-safe behavior wanted (the caller
 * turns either case into a 404). */
export async function updateTaskOwned(
  userId: string,
  taskId: number,
  body: UpdateTaskBody,
): Promise<TaskRecord | null> {
  const [row] = await db
    .update(tasks)
    .set(body)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning()
  if (!row) return null

  const subtaskRows = await db.select().from(subtasks).where(eq(subtasks.taskId, taskId))
  return toTaskRecord(row, subtaskRows)
}

export async function deleteTaskOwned(userId: string, taskId: number): Promise<boolean> {
  const result = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning({ id: tasks.id })

  return result.length > 0
}

/** Used by api/tasks.ts to check a caller-supplied conversationId actually
 * belongs to them before linking it to a new Task — a raw FK insert would
 * otherwise let user A silently link a task to user B's conversation id
 * (no error, just a dangling cross-account reference, since Postgres only
 * enforces the FK exists, not who owns it). */
export async function conversationBelongsToUser(
  userId: string,
  conversationId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1)
  return !!row
}
