// Deliberately duplicated from api/timer-sessions.interfaces.ts rather than
// importing across the client/server boundary — same reasoning as
// SUPPORTED_LANGUAGES in api/preferences.interfaces.ts.
export const TIMER_PRESET_IDS = ['pomodoro-focus', 'short-break', 'long-break', 'custom'] as const
export type TimerPresetId = (typeof TIMER_PRESET_IDS)[number]

export type TimerStatus = 'idle' | 'running' | 'paused'

/**
 * One timer card — not yet started, running, or paused. Several of these can
 * exist at once (multiple concurrent timers). Distinct from `TimerSession`,
 * which is a finished run persisted to history; an instance turns into a
 * session and disappears from this list the moment it completes or is
 * stopped.
 */
export interface TimerInstance {
  id: string
  presetId: TimerPresetId
  /** User-provided name, if any — falls back to the preset's translated
   * name when null (always null for a nameless custom timer too). */
  name: string | null
  plannedSeconds: number
  status: TimerStatus
  remainingSeconds: number
  /** Set the first time this instance starts; kept through pause/resume so
   * the persisted session's startedAt reflects the real start, not the
   * latest resume. */
  startedAt: string | null
  /** Wall-clock timestamp the countdown reaches zero at — set while
   * running, null while idle/paused. The countdown is re-derived from this
   * every tick rather than decremented, so it can't drift. */
  endTimestampMs: number | null
}

/** A finished timer run, either fetched from history or just persisted. */
export interface TimerSession {
  id: number
  presetId: TimerPresetId
  label: string | null
  plannedSeconds: number
  actualSeconds: number
  completed: boolean
  startedAt: string
  endedAt: string
}

export type CreateTimerSession = Omit<TimerSession, 'id'>
