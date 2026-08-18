import { CUSTOM_PRESET_ID, TIMER_PRESETS } from '@/features/timers/TimersTab.constants'
import {
  ALL_TIME_START_ISO,
  DAYS_BY_RANGE_PRESET,
  MONTHLY_BUCKET_THRESHOLD_DAYS,
  MS_PER_DAY,
  WEEKLY_BUCKET_THRESHOLD_DAYS,
} from './DashboardTab.constants'
import type {
  BucketGranularity,
  DashboardStats,
  DateRangePresetId,
  PresetBreakdownSlice,
  TimeSeriesBucket,
  TimerPresetId,
  TimerSession,
} from './DashboardTab.interfaces'

/** Every valid preset id, in the same order the Timers tab's own preset
 * selector uses — imported rather than duplicated, so this list can't drift
 * out of sync with the real preset list. */
const ALL_PRESET_IDS: TimerPresetId[] = [
  ...TIMER_PRESETS.map((preset) => preset.id),
  CUSTOM_PRESET_ID,
]

function startOfLocalDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfLocalDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/** The `{ startDate, endDate }` a date-range preset resolves to, as of
 * `now` — always calendar-day-aligned in local time so "last 7 days"
 * includes exactly 7 whole days (today plus the previous 6), not a rolling
 * 168-hour window that would straddle partial days. */
export function getDateRangeBounds(
  presetId: DateRangePresetId,
  now: Date = new Date(),
): { startDate: Date; endDate: Date } {
  const endDate = endOfLocalDay(now)
  if (presetId === 'all') return { startDate: new Date(ALL_TIME_START_ISO), endDate }

  const days = DAYS_BY_RANGE_PRESET[presetId]
  const startDate = startOfLocalDay(new Date(now.getTime() - (days - 1) * MS_PER_DAY))
  return { startDate, endDate }
}

/** Picks the time-series chart's bucket size from the selected range's
 * span, so a wide range doesn't render one bar per day. */
export function getBucketGranularity(startDate: Date, endDate: Date): BucketGranularity {
  const spanDays = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY)
  if (spanDays <= WEEKLY_BUCKET_THRESHOLD_DAYS) return 'day'
  if (spanDays <= MONTHLY_BUCKET_THRESHOLD_DAYS) return 'week'
  return 'month'
}

/** The start of the bucket a given local date falls into. Weeks start on
 * Monday (ISO-style) rather than Sunday, matching the rest of the app's
 * date handling (Intl formatting doesn't force a week start, but Monday is
 * the more common convention for both the app's languages, en/es). */
function getBucketStart(date: Date, granularity: BucketGranularity): Date {
  const day = startOfLocalDay(date)
  if (granularity === 'day') return day

  if (granularity === 'week') {
    const dayOfWeek = day.getDay() // 0 = Sunday .. 6 = Saturday
    const daysSinceMonday = (dayOfWeek + 6) % 7
    day.setDate(day.getDate() - daysSinceMonday)
    return day
  }

  day.setDate(1)
  return day
}

function advanceBucket(date: Date, granularity: BucketGranularity): Date {
  const next = new Date(date)
  if (granularity === 'day') next.setDate(next.getDate() + 1)
  else if (granularity === 'week') next.setDate(next.getDate() + 7)
  else next.setMonth(next.getMonth() + 1)
  return next
}

/** Buckets sessions into a continuous time series across the whole
 * [startDate, endDate] range — every bucket in range is seeded with 0 first
 * (see loop below), so a day/week/month with no sessions shows as a real
 * gap in the chart rather than being silently omitted, which would
 * compress the axis and misrepresent the gap as "doesn't exist". */
export function buildTimeSeries(
  sessions: readonly TimerSession[],
  startDate: Date,
  endDate: Date,
): TimeSeriesBucket[] {
  const granularity = getBucketGranularity(startDate, endDate)
  const totalsByBucket = new Map<string, number>()

  const lastBucketStart = getBucketStart(endDate, granularity)
  for (
    let cursor = getBucketStart(startDate, granularity);
    cursor.getTime() <= lastBucketStart.getTime();
    cursor = advanceBucket(cursor, granularity)
  ) {
    totalsByBucket.set(cursor.toISOString(), 0)
  }

  for (const session of sessions) {
    const key = getBucketStart(new Date(session.startedAt), granularity).toISOString()
    if (totalsByBucket.has(key)) {
      totalsByBucket.set(key, (totalsByBucket.get(key) ?? 0) + session.actualSeconds)
    }
  }

  return Array.from(totalsByBucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucketStart, totalSeconds]) => ({
      bucketStart,
      granularity,
      totalSeconds,
      totalMinutes: Math.round(totalSeconds / 60),
    }))
}

/** Total logged time per preset across the selected range, ranked highest
 * first. Presets with no sessions in range are omitted — a 0-length bar
 * would carry no information and just clutter the chart. */
export function buildPresetBreakdown(sessions: readonly TimerSession[]): PresetBreakdownSlice[] {
  const totalsByPreset = new Map<TimerPresetId, number>()
  for (const session of sessions) {
    totalsByPreset.set(
      session.presetId,
      (totalsByPreset.get(session.presetId) ?? 0) + session.actualSeconds,
    )
  }

  return ALL_PRESET_IDS.map((presetId) => ({
    presetId,
    totalSeconds: totalsByPreset.get(presetId) ?? 0,
    totalMinutes: Math.round((totalsByPreset.get(presetId) ?? 0) / 60),
  }))
    .filter((slice) => slice.totalSeconds > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
}

/** The KPI row's headline numbers for the selected range. */
export function buildDashboardStats(sessions: readonly TimerSession[]): DashboardStats {
  const totalSeconds = sessions.reduce((sum, session) => sum + session.actualSeconds, 0)
  const sessionsCount = sessions.length
  const completedCount = sessions.filter((session) => session.completed).length

  return {
    totalSeconds,
    sessionsCount,
    completedCount,
    completionRate: sessionsCount > 0 ? completedCount / sessionsCount : 0,
  }
}

/** Splits a total into whole hours + remainder minutes for the "total time"
 * stat tile — kept as plain numbers rather than a formatted string so the
 * component can compose the right i18n key (hours-only/minutes-only/both)
 * instead of this util hardcoding "h"/"min" text. */
export function splitDurationParts(totalSeconds: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(totalSeconds / 60)
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

/** Localized axis label for one time-series bucket, e.g. "Mon 12" (day),
 * "12 Aug" (week, its Monday start), or "Aug 2026" (month). */
export function formatBucketLabel(
  bucketStartIso: string,
  granularity: BucketGranularity,
  locale: string,
): string {
  const date = new Date(bucketStartIso)
  if (granularity === 'day') {
    return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' }).format(date)
  }
  if (granularity === 'week') {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date)
  }
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date)
}
