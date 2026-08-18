import {
  CUSTOM_PRESET_ID,
  DEFAULT_CUSTOM_MINUTES,
  MAX_CUSTOM_MINUTES,
  MAX_TIMER_NAME_LENGTH,
  MIN_CUSTOM_MINUTES,
  TIMER_PRESETS,
} from './TimersTab.constants'
import type {
  TimerInstance,
  TimerPhase,
  TimerPhaseKind,
  TimerPresetId,
} from './TimersTab.interfaces'

/** Formats a duration as `M:SS`, or `H:MM:SS` past an hour. */
export function formatSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  const pad = (value: number) => value.toString().padStart(2, '0')

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

/** Remaining seconds derived from a fixed end timestamp rather than a
 * decrementing counter, so it self-corrects after the interval gets
 * throttled (backgrounded tab) instead of drifting behind. */
export function computeRemainingSeconds(
  endTimestampMs: number,
  nowMs: number = Date.now(),
): number {
  return Math.max(0, Math.ceil((endTimestampMs - nowMs) / 1000))
}

/** Generic minutes clamp — used by any editable duration control, not just
 * the timers feature's own default bounds. */
export function clampMinutes(minutes: number, min: number, max: number): number {
  if (Number.isNaN(minutes)) return min
  return Math.min(max, Math.max(min, Math.round(minutes)))
}

export function clampCustomMinutes(minutes: number): number {
  return clampMinutes(minutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES)
}

/** A preset button's starting-point duration — just a convenient default to
 * seed the (always-editable) duration field with, not a fixed value it's
 * locked to afterward. 'custom' has no fixed default of its own, so it
 * falls back to DEFAULT_CUSTOM_MINUTES. */
export function getPresetDefaultMinutes(presetId: TimerPresetId): number {
  if (presetId === CUSTOM_PRESET_ID) return DEFAULT_CUSTOM_MINUTES
  const preset = TIMER_PRESETS.find((candidate) => candidate.id === presetId)
  return preset?.minutes ?? DEFAULT_CUSTOM_MINUTES
}

/** i18n key for a preset's display name. Custom timers still resolve to a
 * generic "Custom timer" string here — callers that have the user's own
 * free-text name prefer that instead, falling back to this key when none
 * was given. */
export function getPresetTranslationKey(presetId: TimerPresetId): string {
  return `timers.presets.${presetId}`
}

/** Formats a session's timestamp using the app's current language, so
 * history entries read in the same locale as the rest of the UI rather than
 * whatever the browser's default happens to be. */
export function formatSessionTimestamp(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

/** Trims a user-entered timer name, caps its length, and collapses an
 * empty/whitespace-only entry to null so "no name" is a single consistent
 * value throughout the feature. */
export function sanitizeTimerName(rawName: string): string | null {
  const trimmed = rawName.trim().slice(0, MAX_TIMER_NAME_LENGTH)
  return trimmed.length > 0 ? trimmed : null
}

/** A short, sufficiently-unique client-side id for a timer card — these
 * never leave the browser (the persisted session gets its own DB-assigned
 * id), so collision resistance just needs to cover one tab's lifetime. */
export function createTimerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** 0–1 fraction of a timer's planned duration that's elapsed so far, for a
 * progress bar. Idle timers (nothing elapsed yet) read as 0. */
export function getProgressFraction(plannedSeconds: number, remainingSeconds: number): number {
  if (plannedSeconds <= 0) return 0
  return Math.min(1, Math.max(0, 1 - remainingSeconds / plannedSeconds))
}

/** The currently active phase of a Pomodoro timer, or null for a plain
 * single-duration timer (no `phases`). */
export function getActivePhase(
  timer: Pick<TimerInstance, 'phases' | 'phaseIndex'>,
): TimerPhase | null {
  if (!timer.phases) return null
  return timer.phases[timer.phaseIndex ?? 0] ?? null
}

/** The preset id that best describes a timer's current state — its own
 * `presetId` for a plain timer, or a phase-specific id for a Pomodoro
 * (`pomodoro-focus`/`short-break`, both already valid `TimerPresetId`s) so
 * labels and logged sessions reflect whichever phase is actually active. */
export function getActivePresetId(
  timer: Pick<TimerInstance, 'presetId' | 'phases' | 'phaseIndex'>,
): TimerPresetId {
  const phase = getActivePhase(timer)
  if (!phase) return timer.presetId
  return phase.kind === 'focus' ? 'pomodoro-focus' : 'short-break'
}

/** i18n key for a Pomodoro phase's display name ("Focus"/"Break"). */
export function getPhaseTranslationKey(kind: TimerPhaseKind): string {
  return `timers.pomodoro.phase.${kind}`
}
