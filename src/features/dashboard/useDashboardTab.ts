import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { DEFAULT_DATE_RANGE_PRESET } from './DashboardTab.constants'
import {
  buildDashboardStats,
  buildPresetBreakdown,
  buildTimeSeries,
  getDateRangeBounds,
} from './DashboardTab.utils'
import { fetchTimerHistoryInRange } from './useDashboardTab.utils'
import type { DateRangePresetId, TimerSession } from './DashboardTab.interfaces'

export function useDashboardTab() {
  const { isSignedIn, getToken } = useAuth()

  const [rangePresetId, setRangePresetIdState] =
    useState<DateRangePresetId>(DEFAULT_DATE_RANGE_PRESET)
  const [sessions, setSessions] = useState<TimerSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Memoized so the range only recomputes when the preset actually changes,
  // not on every render — keeps the effect below from refetching on
  // unrelated re-renders, and keeps buildTimeSeries' bucket boundaries
  // consistent with whatever range the current `sessions` were fetched for.
  const { startDate, endDate } = useMemo(() => getDateRangeBounds(rangePresetId), [rangePresetId])

  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false
    setIsLoading(true)
    void fetchTimerHistoryInRange(startDate, endDate, getToken).then((result) => {
      if (cancelled) return
      setSessions(result)
      setIsLoading(false)
      setHasLoadedOnce(true)
    })
    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken, startDate, endDate])

  const setRangePresetId = useCallback((presetId: DateRangePresetId) => {
    setRangePresetIdState(presetId)
  }, [])

  const stats = useMemo(() => buildDashboardStats(sessions), [sessions])
  const timeSeries = useMemo(
    () => buildTimeSeries(sessions, startDate, endDate),
    [sessions, startDate, endDate],
  )
  const presetBreakdown = useMemo(() => buildPresetBreakdown(sessions), [sessions])

  return {
    rangePresetId,
    setRangePresetId,
    isLoading,
    hasLoadedOnce,
    stats,
    timeSeries,
    presetBreakdown,
  }
}
