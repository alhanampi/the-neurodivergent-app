import type { TimerPresetId } from './TimersTab.interfaces'

export interface TimerPresetDefinition {
  id: Exclude<TimerPresetId, 'custom'>
  minutes: number
}

// Fixed durations, not user-editable in this iteration — see ROADMAP.md
// (v0.7.0) for scope. "Custom" is a separate, fourth option handled by its
// own minutes input rather than living in this list.
export const TIMER_PRESETS: TimerPresetDefinition[] = [
  { id: 'pomodoro-focus', minutes: 25 },
  { id: 'short-break', minutes: 5 },
  { id: 'long-break', minutes: 15 },
]

export const CUSTOM_PRESET_ID: TimerPresetId = 'custom'

export const DEFAULT_CUSTOM_MINUTES = 10
export const MIN_CUSTOM_MINUTES = 1
export const MAX_CUSTOM_MINUTES = 180

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
