import { describe, expect, it } from 'vitest'
import {
  buildDashboardStats,
  buildPresetBreakdown,
  buildTimeSeries,
  formatBucketLabel,
  getBucketGranularity,
  getDateRangeBounds,
  splitDurationParts,
} from './DashboardTab.utils'
import type { TimerSession } from './DashboardTab.interfaces'

// All dates below are built via the local `new Date(y, m, d, ...)`
// constructor rather than hardcoded UTC ISO strings — the code under test
// buckets/clamps in local time (see startOfLocalDay), so a hardcoded UTC
// string would only pass in whichever timezone it was written in. Building
// both the input and the expectation from the same local constructor keeps
// these tests correct regardless of where they run (e.g. a UTC CI runner
// vs. a non-UTC dev machine).
function localDate(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  return new Date(year, month, day, hours, minutes, 0, 0)
}

function localIso(year: number, month: number, day: number, hours = 0, minutes = 0): string {
  return localDate(year, month, day, hours, minutes).toISOString()
}

function makeSession(overrides: Partial<TimerSession> = {}): TimerSession {
  return {
    id: 1,
    presetId: 'pomodoro-focus',
    label: null,
    plannedSeconds: 1500,
    actualSeconds: 1500,
    completed: true,
    startedAt: localIso(2026, 7, 10, 10, 0), // Aug 10 2026
    endedAt: localIso(2026, 7, 10, 10, 25),
    taskId: null,
    subtaskId: null,
    taskLabel: null,
    ...overrides,
  }
}

describe('getDateRangeBounds', () => {
  const now = localDate(2026, 7, 18, 15, 30) // Aug 18 2026, 15:30 local

  it('resolves "7d" to 7 whole calendar days ending today', () => {
    const { startDate, endDate } = getDateRangeBounds('7d', now)

    expect(startDate).toEqual(localDate(2026, 7, 12, 0, 0))
    expect(endDate).toEqual(new Date(2026, 7, 18, 23, 59, 59, 999))
  })

  it('resolves "30d" and "90d" the same way, just further back', () => {
    expect(getDateRangeBounds('30d', now).startDate).toEqual(localDate(2026, 6, 20, 0, 0))
    expect(getDateRangeBounds('90d', now).startDate).toEqual(localDate(2026, 4, 21, 0, 0))
  })

  it('resolves "all" to the fixed all-time sentinel', () => {
    const { startDate } = getDateRangeBounds('all', now)
    expect(startDate.toISOString()).toBe('2020-01-01T00:00:00.000Z')
  })
})

describe('getBucketGranularity', () => {
  it('buckets by day for a range within the weekly threshold', () => {
    expect(getBucketGranularity(localDate(2026, 7, 1), localDate(2026, 7, 18))).toBe('day')
  })

  it('buckets by week for a range past the weekly threshold', () => {
    expect(getBucketGranularity(localDate(2026, 5, 1), localDate(2026, 7, 18))).toBe('week')
  })

  it('buckets by month for a range past the monthly threshold', () => {
    expect(getBucketGranularity(localDate(2020, 0, 1), localDate(2026, 7, 18))).toBe('month')
  })
})

describe('buildTimeSeries', () => {
  it('sums sessions into their day bucket and seeds empty days with 0', () => {
    const sessions = [
      makeSession({ startedAt: localIso(2026, 7, 10, 9, 0), actualSeconds: 600 }),
      makeSession({ startedAt: localIso(2026, 7, 10, 20, 0), actualSeconds: 900 }),
      makeSession({ startedAt: localIso(2026, 7, 12, 9, 0), actualSeconds: 300 }),
    ]

    const series = buildTimeSeries(
      sessions,
      localDate(2026, 7, 10, 0, 0),
      new Date(2026, 7, 12, 23, 59, 59, 999),
    )

    expect(series).toHaveLength(3)
    expect(series[0]).toMatchObject({ totalSeconds: 1500, totalMinutes: 25 })
    expect(series[1]).toMatchObject({ totalSeconds: 0, totalMinutes: 0 })
    expect(series[2]).toMatchObject({ totalSeconds: 300, totalMinutes: 5 })
  })

  it('excludes a session outside the given bounds', () => {
    const sessions = [makeSession({ startedAt: localIso(2026, 7, 1, 9, 0) })]

    const series = buildTimeSeries(
      sessions,
      localDate(2026, 7, 10, 0, 0),
      new Date(2026, 7, 12, 23, 59, 59, 999),
    )

    expect(series.every((bucket) => bucket.totalSeconds === 0)).toBe(true)
  })
})

describe('buildPresetBreakdown', () => {
  it('sums time per preset, ranked highest first, omitting presets with no sessions', () => {
    const sessions = [
      makeSession({ presetId: 'pomodoro-focus', actualSeconds: 300 }),
      makeSession({ presetId: 'short-break', actualSeconds: 900 }),
      makeSession({ presetId: 'pomodoro-focus', actualSeconds: 200 }),
    ]

    expect(buildPresetBreakdown(sessions)).toEqual([
      { presetId: 'short-break', totalSeconds: 900, totalMinutes: 15 },
      { presetId: 'pomodoro-focus', totalSeconds: 500, totalMinutes: 8 },
    ])
  })

  it('returns an empty array for no sessions', () => {
    expect(buildPresetBreakdown([])).toEqual([])
  })
})

describe('buildDashboardStats', () => {
  it('computes total time, session count, and completion rate', () => {
    const sessions = [
      makeSession({ actualSeconds: 600, completed: true }),
      makeSession({ actualSeconds: 300, completed: false }),
      makeSession({ actualSeconds: 900, completed: true }),
    ]

    expect(buildDashboardStats(sessions)).toEqual({
      totalSeconds: 1800,
      sessionsCount: 3,
      completedCount: 2,
      completionRate: 2 / 3,
    })
  })

  it('handles no sessions without dividing by zero', () => {
    expect(buildDashboardStats([])).toEqual({
      totalSeconds: 0,
      sessionsCount: 0,
      completedCount: 0,
      completionRate: 0,
    })
  })
})

describe('splitDurationParts', () => {
  it('splits seconds into hours and remainder minutes', () => {
    expect(splitDurationParts(3600 + 5 * 60)).toEqual({ hours: 1, minutes: 5 })
  })

  it('rounds to the nearest minute', () => {
    expect(splitDurationParts(90)).toEqual({ hours: 0, minutes: 2 })
  })
})

describe('formatBucketLabel', () => {
  it('formats a day bucket without throwing', () => {
    const label = formatBucketLabel(localIso(2026, 7, 10), 'day', 'en')
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })

  it('formats a week bucket with the short month name', () => {
    const label = formatBucketLabel(localIso(2026, 7, 10), 'week', 'en')
    expect(label).toMatch(/Aug/)
  })

  it('formats a month bucket as short month + year', () => {
    const label = formatBucketLabel(localIso(2026, 7, 10), 'month', 'en')
    expect(label).toMatch(/Aug 2026/)
  })
})
