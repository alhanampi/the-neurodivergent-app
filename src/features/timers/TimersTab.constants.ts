import type { TimerPresetId } from './TimersTab.interfaces'

export interface TimerPresetDefinition {
  id: Exclude<TimerPresetId, 'custom'>
  /** Suggested single-phase duration to prefill the "Add timer" popup with.
   * Omitted for `pomodoro-focus` — selecting Focus no longer creates a
   * single-duration timer at all; it opens the Pomodoro dialog instead (see
   * PomodoroDialog and useTimersTab's openAddDialog). */
  minutes?: number
}

// Starting-point durations for the short/long break quick-select buttons —
// the actual duration is always further editable (typed or scrolled)
// afterward, both in the popup and on an idle timer card, so these are
// defaults, not fixed values. "Custom time" is a separate, fourth button
// with no preset duration of its own (falls back to DEFAULT_CUSTOM_MINUTES).
export const TIMER_PRESETS: TimerPresetDefinition[] = [
  { id: 'pomodoro-focus' },
  { id: 'short-break', minutes: 5 },
  { id: 'long-break', minutes: 15 },
]

export const CUSTOM_PRESET_ID: TimerPresetId = 'custom'
export const POMODORO_PRESET_ID: TimerPresetId = 'pomodoro-focus'

export const DEFAULT_CUSTOM_MINUTES = 10
export const MIN_CUSTOM_MINUTES = 1
export const MAX_CUSTOM_MINUTES = 180

// Defaults offered by the Pomodoro dialog — the classic Pomodoro cadence,
// always editable before confirming (see PomodoroDialog).
export const DEFAULT_POMODORO_FOCUS_MINUTES = 20
export const DEFAULT_POMODORO_BREAK_MINUTES = 10

export const MAX_TIMER_NAME_LENGTH = 60

/** How often the running countdown re-derives itself from the wall-clock end
 * timestamp (not by decrementing a counter, so it stays correct even if the
 * tab was backgrounded and the interval got throttled). */
export const TICK_INTERVAL_MS = 250

/** A manual stop below this many elapsed seconds isn't worth logging —
 * almost always a mis-tap, and it'd just clutter the history with 0:01
 * entries. Also the threshold below which stopping a timer skips the
 * confirmation dialog (an idle or barely-started timer has nothing to
 * lose). */
export const MIN_LOGGABLE_SECONDS = 5

/** localStorage key for the optional per-second tick sound — a plain user
 * preference, not account data, so it stays local like the timer's other
 * ephemeral UI state (no /api round trip needed). */
export const TIMER_SOUND_STORAGE_KEY = 'nd-app:timers:sound-enabled'
