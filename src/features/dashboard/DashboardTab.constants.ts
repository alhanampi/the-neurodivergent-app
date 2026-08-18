import type { DateRangePresetId } from './DashboardTab.interfaces'

// Relative presets only, no free-form calendar range picker — a personal
// timer-tracking dashboard doesn't need one, and it avoids pulling in
// @mui/x-date-pickers (another dependency, more bundle weight) for a
// feature that "last 7/30/90 days" and "all time" already cover. Revisit if
// a real use case for an arbitrary custom range shows up.
export const DATE_RANGE_PRESETS: readonly DateRangePresetId[] = ['7d', '30d', '90d', 'all']
export const DEFAULT_DATE_RANGE_PRESET: DateRangePresetId = '30d'

export const DAYS_BY_RANGE_PRESET: Record<Exclude<DateRangePresetId, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

/** "All time" has no real start date server-side — this stands in as "the
 * beginning", well before the app existed, so the date-range query still
 * has a concrete lower bound to send. */
export const ALL_TIME_START_ISO = '2020-01-01T00:00:00.000Z'

export const MS_PER_DAY = 24 * 60 * 60 * 1000

// Above this many days in the selected range, the time-series chart buckets
// by week instead of by day; past MONTHLY_BUCKET_THRESHOLD_DAYS it buckets
// by month. Otherwise a wide range (e.g. "All time") renders one bar per
// day and turns into unreadable clutter on a mobile-width chart — see
// getBucketGranularity.
export const WEEKLY_BUCKET_THRESHOLD_DAYS = 31
export const MONTHLY_BUCKET_THRESHOLD_DAYS = 180

export const CHART_HEIGHT = 240
