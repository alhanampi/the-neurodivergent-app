// Reuses TimerSession/TimerPresetId from the timers feature rather than
// duplicating them — unlike the api/ <-> src/ duplication elsewhere (e.g.
// TimersTab.interfaces.ts's own TIMER_PRESET_IDS), both of these live in
// src/ and ship in the same client bundle, so importing across features here
// doesn't cross any secret/server boundary — it's just reuse.
import type { TimerPresetId, TimerSession } from '@/features/timers/TimersTab.interfaces'

export type { TimerPresetId, TimerSession }

/** Relative date-range presets the Dashboard's filter row offers. Always
 * relative to "now" rather than a free-form calendar picker — see
 * DashboardTab.constants.ts for why. */
export type DateRangePresetId = '7d' | '30d' | '90d' | 'all'

/** How the time-series chart buckets sessions — adapts to the selected
 * range's span so a wide range (e.g. "All time") doesn't render one bar per
 * day and turn into unreadable clutter. See getBucketGranularity. */
export type BucketGranularity = 'day' | 'week' | 'month'

/** One point on the time-series chart — a bucket's total logged time. */
export interface TimeSeriesBucket {
  /** ISO timestamp of the bucket's start, in local time. */
  bucketStart: string
  granularity: BucketGranularity
  totalSeconds: number
  /** Rounded minutes, precomputed so the chart doesn't need inline math for
   * its dataset. */
  totalMinutes: number
}

/** One bar on the preset-breakdown chart — total logged time for one preset,
 * across the selected range. Only presets with at least one session appear
 * (see buildPresetBreakdown). */
export interface PresetBreakdownSlice {
  presetId: TimerPresetId
  totalSeconds: number
  totalMinutes: number
}

/** Headline numbers for the selected range's KPI row. */
export interface DashboardStats {
  totalSeconds: number
  sessionsCount: number
  completedCount: number
  /** 0–1 fraction of sessions that ran to completion vs. were stopped early. */
  completionRate: number
}
