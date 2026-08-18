import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { timerSessions } from '../db/schema'
import { TIMER_PRESET_IDS } from './timer-sessions.interfaces'
import type {
  CreateTimerSessionBody,
  TimerPresetId,
  TimerSessionRecord,
} from './timer-sessions.interfaces'

/** Longest a single timer session is allowed to claim, in seconds (24h) —
 * a sanity ceiling against malformed or malicious payloads, not a product
 * limit (no preset comes close to it). */
const MAX_SESSION_SECONDS = 24 * 60 * 60

/** How many recent sessions GET /api/timer-sessions returns. */
const HISTORY_LIMIT = 50

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

/** Validates an untrusted request body into a well-formed session, or
 * returns null if anything about it doesn't check out. */
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

  return {
    presetId: candidate.presetId,
    label: (candidate.label as string | null | undefined) ?? null,
    plannedSeconds: candidate.plannedSeconds,
    actualSeconds: candidate.actualSeconds,
    completed: candidate.completed,
    startedAt: candidate.startedAt,
    endedAt: candidate.endedAt,
  }
}

export async function listTimerSessions(userId: string): Promise<TimerSessionRecord[]> {
  const rows = await db
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
  }
}
