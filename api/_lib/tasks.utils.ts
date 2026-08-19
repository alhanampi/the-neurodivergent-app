import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { tasks } from '../../db/schema.js'
import {
  MAX_TASKS_PER_REQUEST,
  MAX_TASK_MINUTES,
  MAX_TASK_TITLE_LENGTH,
  MIN_TASK_MINUTES,
  TASKS_LIST_LIMIT,
} from './tasks.constants.js'
import type { CreateTasksBody, TaskRecord, UpdateTaskBody } from './tasks.interfaces.js'

function normalizeTaskStep(value: unknown): { title: string; minutes: number } | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>

  if (typeof candidate.title !== 'string') return null
  const title = candidate.title.trim()
  if (title.length === 0 || title.length > MAX_TASK_TITLE_LENGTH) return null

  if (typeof candidate.minutes !== 'number' || !Number.isFinite(candidate.minutes)) return null
  const minutes = Math.round(candidate.minutes)
  if (minutes < MIN_TASK_MINUTES || minutes > MAX_TASK_MINUTES) return null

  return { title, minutes }
}

/** Validates a batch-create body — one approved AI Chat plan's worth of
 * steps. Same hand-guard style as every other untrusted-input parser in
 * this codebase, no validation library. */
export function parseCreateTasksBody(body: unknown): CreateTasksBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>
  if (!Array.isArray(candidate.steps)) return null
  if (candidate.steps.length === 0 || candidate.steps.length > MAX_TASKS_PER_REQUEST) return null

  const steps: { title: string; minutes: number }[] = []
  for (const rawStep of candidate.steps) {
    const step = normalizeTaskStep(rawStep)
    if (!step) return null
    steps.push(step)
  }

  return { steps }
}

export function parseUpdateTaskBody(body: unknown): UpdateTaskBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>
  if (typeof candidate.completed !== 'boolean') return null
  return { completed: candidate.completed }
}

function toTaskRecord(row: {
  id: number
  title: string
  estimatedMinutes: number
  completed: boolean
  createdAt: Date
  completedAt: Date | null
}): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    estimatedMinutes: row.estimatedMinutes,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  }
}

/** Incomplete tasks first (newest first among themselves), completed ones
 * after (also newest first) — so finishing something doesn't make it
 * disappear, just settle to the bottom. */
export async function listTasksForUser(userId: string): Promise<TaskRecord[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.completed), desc(tasks.createdAt))
    .limit(TASKS_LIST_LIMIT)

  return rows.map(toTaskRecord)
}

export async function createTasks(
  userId: string,
  steps: { title: string; minutes: number }[],
): Promise<TaskRecord[]> {
  const rows = await db
    .insert(tasks)
    .values(steps.map((step) => ({ userId, title: step.title, estimatedMinutes: step.minutes })))
    .returning()

  return rows.map(toTaskRecord)
}

/** Ownership is enforced directly in the WHERE clause (userId + id both
 * required to match) rather than via a separate pre-check query — an
 * update/delete that matches zero rows because the task belongs to someone
 * else looks identical to one that matches zero rows because the id
 * doesn't exist, which is exactly the IDOR-safe behavior wanted (the caller
 * turns either case into a 404). */
export async function updateTaskCompleted(
  userId: string,
  taskId: number,
  completed: boolean,
): Promise<TaskRecord | null> {
  const [row] = await db
    .update(tasks)
    .set({ completed, completedAt: completed ? new Date() : null })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning()

  return row ? toTaskRecord(row) : null
}

export async function deleteTaskOwned(userId: string, taskId: number): Promise<boolean> {
  const result = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning({ id: tasks.id })

  return result.length > 0
}
