// Deliberately duplicated from api/timer-sessions.interfaces.ts rather than
// importing across the client/server boundary — same reasoning as
// SUPPORTED_LANGUAGES in api/preferences.interfaces.ts.
export const TIMER_PRESET_IDS = ['pomodoro-focus', 'short-break', 'long-break', 'custom'] as const
export type TimerPresetId = (typeof TIMER_PRESET_IDS)[number]

export type TimerStatus = 'idle' | 'running' | 'paused'

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
