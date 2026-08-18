import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDashboardTab } from './useDashboardTab'

let isSignedIn = true
const mockGetToken = vi.fn(async () => 'token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn, getToken: mockGetToken }),
}))

const mockFetchTimerHistoryInRange = vi.fn(
  async (_startDate: Date, _endDate: Date, _getToken: unknown) => [] as unknown[],
)

vi.mock('./useDashboardTab.utils', () => ({
  fetchTimerHistoryInRange: (startDate: Date, endDate: Date, getToken: unknown) =>
    mockFetchTimerHistoryInRange(startDate, endDate, getToken),
}))

describe('useDashboardTab', () => {
  beforeEach(() => {
    isSignedIn = true
    mockFetchTimerHistoryInRange.mockClear()
    mockFetchTimerHistoryInRange.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('starts on the default 30-day range and fetches history for it', async () => {
    const { result } = renderHook(() => useDashboardTab())

    expect(result.current.rangePresetId).toBe('30d')
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))
    expect(mockFetchTimerHistoryInRange).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when signed out', async () => {
    isSignedIn = false
    renderHook(() => useDashboardTab())

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mockFetchTimerHistoryInRange).not.toHaveBeenCalled()
  })

  it('refetches when the range preset changes', async () => {
    const { result } = renderHook(() => useDashboardTab())
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.setRangePresetId('7d'))

    await waitFor(() => expect(mockFetchTimerHistoryInRange).toHaveBeenCalledTimes(2))
    expect(result.current.rangePresetId).toBe('7d')
  })

  it('derives stats/timeSeries/presetBreakdown from the fetched sessions', async () => {
    mockFetchTimerHistoryInRange.mockResolvedValue([
      {
        id: 1,
        presetId: 'pomodoro-focus',
        label: null,
        plannedSeconds: 1500,
        actualSeconds: 1500,
        completed: true,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
      },
    ])

    const { result } = renderHook(() => useDashboardTab())
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    expect(result.current.stats).toEqual({
      totalSeconds: 1500,
      sessionsCount: 1,
      completedCount: 1,
      completionRate: 1,
    })
    expect(result.current.presetBreakdown).toEqual([
      { presetId: 'pomodoro-focus', totalSeconds: 1500, totalMinutes: 25 },
    ])
    expect(result.current.timeSeries.length).toBeGreaterThan(0)
  })
})
