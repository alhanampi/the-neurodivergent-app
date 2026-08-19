import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { subtasks, tasks, timerSessions } from '../../db/schema.js'
import { MAX_TASK_TITLE_LENGTH } from './tasks.constants.js'
import { TIMER_PRESET_IDS } from './timer-sessions.interfaces.js'
import type {
  CreateTimerSessionBody,
  DateRangeFilter,
  TimerPresetId,
  TimerSessionRecord,
} from './timer-sessions.interfaces.js'

/** Longest a single timer session is allowed to claim, in seconds (24h) —
 * a sanity ceiling against malformed or malicious payloads, not a product
 * limit (no preset comes close to it). */
const MAX_SESSION_SECONDS = 24 * 60 * 60

/** How many recent sessions a plain GET /api/timer-sessions (no date range —
 * the Timers tab's "recent history" list) returns. */
const HISTORY_LIMIT = 50

/** How many sessions a date-ranged GET (the Dashboard tab) returns. Higher
 * than HISTORY_LIMIT since a wide "all time" range needs every session to
 * aggregate correctly, not just the most recent ones — still a sanity
 * ceiling against an unbounded query, not a product limit anyone doing
 * personal timer tracking would realistically hit. */
const DASHBOARD_QUERY_LIMIT = 2000

function isValidPresetId(value: unknown): value is TimerPresetId {
  return typeof value === 'string' && (TIMER_PRESET_IDS as readonly string[]).includes(value)
}

function isPositiveSeconds(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_SESSION_SECONDS
  )
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isPositiveIntegerOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value > 0)
}

/** Validates an untrusted request body into a well-formed session, or
 * returns null if anything about it doesn't check out. Does NOT verify the
 * optional taskId/subtaskId actually belong to the caller — that's an
 * async DB check, done separately by verifyTaskLinkOwnership so this stays a
 * pure parser like every other one in this codebase. */
export function parseCreateTimerSessionBody(body: unknown): CreateTimerSessionBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>

  if (!isValidPresetId(candidate.presetId)) return null
  if (!isPositiveSeconds(candidate.plannedSeconds)) return null
  if (!isPositiveSeconds(candidate.actualSeconds)) return null
  if (typeof candidate.completed !== 'boolean') return null
  if (!isValidIsoDate(candidate.startedAt)) return null
  if (!isValidIsoDate(candidate.endedAt)) return null
  if (Date.parse(candidate.endedAt) < Date.parse(candidate.startedAt)) return null
  if (
    candidate.label !== undefined &&
    candidate.label !== null &&
    typeof candidate.label !== 'string'
  ) {
    return null
  }

  const taskId = candidate.taskId ?? null
  if (!isPositiveIntegerOrNull(taskId)) return null
  const subtaskId = candidate.subtaskId ?? null
  if (!isPositiveIntegerOrNull(subtaskId)) return null
  // A linked subtask always carries its parent task's id too — a
  // subtaskId with no taskId is malformed input, not a valid "linked to a
  // subtask but not its task" state.
  if (subtaskId !== null && taskId === null) return null

  let taskLabel: string | null = null
  if (candidate.taskLabel !== undefined && candidate.taskLabel !== null) {
    if (typeof candidate.taskLabel !== 'string') return null
    const trimmed = candidate.taskLabel.trim()
    if (trimmed.length === 0 || trimmed.length > MAX_TASK_TITLE_LENGTH) return null
    taskLabel = trimmed
  }
  // A link needs a label to render in history once the source Task/Subtask
  // may no longer exist — reject taskId/subtaskId given without one rather
  // than silently storing an unlabeled link.
  if (taskId !== null && taskLabel === null) return null

  return {
    presetId: candidate.presetId,
    label: (candidate.label as string | null | undefined) ?? null,
    plannedSeconds: candidate.plannedSeconds,
    actualSeconds: candidate.actualSeconds,
    completed: candidate.completed,
    startedAt: candidate.startedAt,
    endedAt: candidate.endedAt,
    taskId,
    subtaskId,
    taskLabel,
  }
}

/** Confirms a caller-supplied taskId/subtaskId link actually belongs to
 * them before it's written — same IDOR-safe reasoning as
 * tasks.utils.ts's conversationBelongsToUser (a raw FK insert would
 * otherwise let user A silently link a session to user B's task, since
 * Postgres only enforces the FK exists, not who owns it). No link at all
 * (both null) is always valid and skips the query entirely. */
export async function verifyTaskLinkOwnership(
  userId: string,
  taskId: number | null,
  subtaskId: number | null,
): Promise<boolean> {
  if (taskId === null) return true

  if (subtaskId !== null) {
    const [row] = await db
      .select({ taskId: subtasks.taskId, userId: tasks.userId })
      .from(subtasks)
      .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
      .where(eq(subtasks.id, subtaskId))
      .limit(1)
    return !!row && row.userId === userId && row.taskId === taskId
  }

  const [row] = await db
    .select({ userId: tasks.userId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
  return !!row && row.userId === userId
}

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** Parses the optional `startDate`/`endDate` query params GET
 * /api/timer-sessions accepts for the Dashboard tab's date-range filter.
 * `undefined` means neither was given (the Timers tab's plain "recent
 * history" call — falls back to the existing unfiltered/HISTORY_LIMIT
 * behavior); `null` means one or both were given but malformed, which the
 * handler turns into a 400 rather than silently ignoring bad input. */
export function parseDateRangeQuery(
  query: Record<string, string | string[] | undefined>,
): DateRangeFilter | null | undefined {
  const rawStart = firstQueryValue(query.startDate)
  const rawEnd = firstQueryValue(query.endDate)
  if (rawStart === undefined && rawEnd === undefined) return undefined
  if (rawStart === undefined || rawEnd === undefined) return null

  const startMs = Date.parse(rawStart)
  const endMs = Date.parse(rawEnd)
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || startMs > endMs) return null

  return { startDate: new Date(startMs), endDate: new Date(endMs) }
}

export async function listTimerSessions(
  userId: string,
  range?: DateRangeFilter,
): Promise<TimerSessionRecord[]> {
  const rows = range
    ? await db
        .select()
        .from(timerSessions)
        .where(
          and(
            eq(timerSessions.userId, userId),
            gte(timerSessions.startedAt, range.startDate),
            lte(timerSessions.startedAt, range.endDate),
          ),
        )
        .orderBy(desc(timerSessions.startedAt))
        .limit(DASHBOARD_QUERY_LIMIT)
    : await db
        .select()
        .from(timerSessions)
        .where(eq(timerSessions.userId, userId))
        .orderBy(desc(timerSessions.startedAt))
        .limit(HISTORY_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    presetId: row.presetId as TimerPresetId,
    label: row.label,
    plannedSeconds: row.plannedSeconds,
    actualSeconds: row.actualSeconds,
    completed: row.completed,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt.toISOString(),
    taskId: row.taskId,
    subtaskId: row.subtaskId,
    taskLabel: row.taskLabel,
  }))
}

export async function createTimerSession(
  userId: string,
  body: CreateTimerSessionBody,
): Promise<TimerSessionRecord> {
  const [row] = await db
    .insert(timerSessions)
    .values({
      userId,
      presetId: body.presetId,
      label: body.label ?? null,
      plannedSeconds: body.plannedSeconds,
      actualSeconds: body.actualSeconds,
      completed: body.completed,
      startedAt: new Date(body.startedAt),
      endedAt: new Date(body.endedAt),
      taskId: body.taskId ?? null,
      subtaskId: body.subtaskId ?? null,
      taskLabel: body.taskLabel ?? null,
    })
    .returning()

  return {
    id: row.id,
    presetId: row.presetId as TimerPresetId,
    label: row.label,
    plannedSeconds: row.plannedSeconds,
    actualSeconds: row.actualSeconds,
    completed: row.completed,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt.toISOString(),
    taskId: row.taskId,
    subtaskId: row.subtaskId,
    taskLabel: row.taskLabel,
  }
}
