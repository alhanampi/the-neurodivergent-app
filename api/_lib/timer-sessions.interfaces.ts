// Deliberately duplicated from src/features/timers/TimersTab.constants.ts
// rather than importing across the client/server boundary — same reasoning
// as SUPPORTED_LANGUAGES in preferences.interfaces.ts.
export const TIMER_PRESET_IDS = ['pomodoro-focus', 'short-break', 'long-break', 'custom'] as const
export type TimerPresetId = (typeof TIMER_PRESET_IDS)[number]

/** A session as it comes back from GET /api/timer-sessions — dates are ISO
 * strings on the wire, parsed into Date objects on the client when needed.
 * `taskId`/`subtaskId`/`taskLabel` (iteration 8b) are the optional link to
 * what the session was spent on — see db/schema.ts's doc comment on
 * `timerSessions` for the full reasoning. All three are null together, or
 * all set together (a session is never linked to a subtask without also
 * carrying its parent taskId). */
export interface TimerSessionRecord {
  id: number
  presetId: TimerPresetId
  label: string | null
  plannedSeconds: number
  actualSeconds: number
  completed: boolean
  startedAt: string
  endedAt: string
  taskId: number | null
  subtaskId: number | null
  taskLabel: string | null
}

/** Parsed `startDate`/`endDate` bounds for a date-ranged GET
 * /api/timer-sessions call (the Dashboard tab) — see
 * timer-sessions.utils.ts's parseDateRangeQuery. */
export interface DateRangeFilter {
  startDate: Date
  endDate: Date
}

/** Body for POST /api/timer-sessions — one finished (completed or manually
 * stopped) timer run. `taskId`/`subtaskId`/`taskLabel` are optional and, if
 * `taskId` (or `subtaskId`) is given, verified server-side to actually
 * belong to the caller before being written — see
 * timer-sessions.utils.ts's verifyTaskLinkOwnership. */
export interface CreateTimerSessionBody {
  presetId: TimerPresetId
  label?: string | null
  plannedSeconds: number
  actualSeconds: number
  completed: boolean
  startedAt: string
  endedAt: string
  taskId?: number | null
  subtaskId?: number | null
  taskLabel?: string | null
}
