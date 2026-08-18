import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import {
  CUSTOM_PRESET_ID,
  MIN_LOGGABLE_SECONDS,
  TICK_INTERVAL_MS,
  TIMER_PRESETS,
} from './TimersTab.constants'
import {
  clampCustomMinutes,
  computeRemainingSeconds,
  getPlannedSeconds,
  getPresetTranslationKey,
} from './TimersTab.utils'
import {
  fetchTimerHistory,
  getNotificationPermission,
  notifyTimerComplete,
  postTimerSession,
  requestNotificationPermission,
} from './useTimersTab.utils'
import type { TimerPresetId, TimerSession, TimerStatus } from './TimersTab.interfaces'

const HISTORY_LIMIT = 50

interface ActiveRun {
  presetId: TimerPresetId
  label: string | null
  plannedSeconds: number
  startedAt: Date
  endTimestampMs: number
}

export function useTimersTab() {
  const { t } = useTranslation()
  const { isSignedIn, getToken } = useAuth()

  const [status, setStatus] = useState<TimerStatus>('idle')
  const [selectedPresetId, setSelectedPresetId] = useState<TimerPresetId>(TIMER_PRESETS[0].id)
  const [customMinutes, setCustomMinutesState] = useState(10)
  const [customLabel, setCustomLabelState] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [history, setHistory] = useState<TimerSession[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission)

  // Locked in for the duration of the active run — read at finish time,
  // doesn't need to trigger re-renders on its own.
  const activeRunRef = useRef<ActiveRun | null>(null)

  const plannedSecondsPreview = getPlannedSeconds(selectedPresetId, customMinutes)
  const displaySeconds = status === 'idle' ? plannedSecondsPreview : remainingSeconds
  const progressFraction = status === 'idle' ? 0 : 1 - remainingSeconds / plannedSecondsPreview

  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false
    setIsHistoryLoading(true)
    void fetchTimerHistory(getToken).then((sessions) => {
      if (cancelled) return
      setHistory(sessions)
      setIsHistoryLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken])

  // completed=true always means "ran out naturally" (elapsed === planned).
  // completed=false takes the elapsed time from whatever remaining seconds
  // the caller had on hand — accurate whether stopped mid-run (the interval
  // below keeps `remainingSeconds` fresh to within TICK_INTERVAL_MS) or
  // stopped while paused (frozen exactly, since no time passes then).
  const finishSession = useCallback(
    (completed: boolean, remainingAtFinish: number) => {
      const run = activeRunRef.current
      activeRunRef.current = null
      setStatus('idle')
      if (!run) return

      const elapsedSeconds = completed
        ? run.plannedSeconds
        : Math.max(0, run.plannedSeconds - remainingAtFinish)

      if (elapsedSeconds >= MIN_LOGGABLE_SECONDS) {
        const session = {
          presetId: run.presetId,
          label: run.label,
          plannedSeconds: run.plannedSeconds,
          actualSeconds: elapsedSeconds,
          completed,
          startedAt: run.startedAt.toISOString(),
          endedAt: new Date().toISOString(),
        }

        void postTimerSession(session, getToken).then((saved) => {
          if (saved) setHistory((current) => [saved, ...current].slice(0, HISTORY_LIMIT))
        })
      }

      if (completed) {
        const title = t('timers.notification.title')
        const body = run.label || t(getPresetTranslationKey(run.presetId))
        void notifyTimerComplete(title, body)
      }
    },
    [getToken, t],
  )

  useEffect(() => {
    if (status !== 'running') return

    const tick = () => {
      const run = activeRunRef.current
      if (!run) return
      const remaining = computeRemainingSeconds(run.endTimestampMs)
      setRemainingSeconds(remaining)
      if (remaining <= 0) {
        finishSession(true, 0)
      }
    }

    tick()
    const intervalId = window.setInterval(tick, TICK_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [status, finishSession])

  const selectPreset = useCallback(
    (presetId: TimerPresetId) => {
      if (status !== 'idle') return
      setSelectedPresetId(presetId)
    },
    [status],
  )

  const setCustomMinutes = useCallback(
    (minutes: number) => {
      if (status !== 'idle') return
      setCustomMinutesState(clampCustomMinutes(minutes))
    },
    [status],
  )

  const setCustomLabel = useCallback(
    (label: string) => {
      if (status !== 'idle') return
      setCustomLabelState(label)
    },
    [status],
  )

  const start = useCallback(() => {
    if (status !== 'idle') return
    const plannedSeconds = getPlannedSeconds(selectedPresetId, customMinutes)
    const startedAt = new Date()

    activeRunRef.current = {
      presetId: selectedPresetId,
      label: selectedPresetId === CUSTOM_PRESET_ID ? customLabel.trim() || null : null,
      plannedSeconds,
      startedAt,
      endTimestampMs: startedAt.getTime() + plannedSeconds * 1000,
    }
    setRemainingSeconds(plannedSeconds)
    setStatus('running')
  }, [customLabel, customMinutes, selectedPresetId, status])

  const pauseOrResume = useCallback(() => {
    const run = activeRunRef.current
    if (!run) return

    if (status === 'running') {
      setRemainingSeconds(computeRemainingSeconds(run.endTimestampMs))
      setStatus('paused')
      return
    }

    if (status === 'paused') {
      activeRunRef.current = { ...run, endTimestampMs: Date.now() + remainingSeconds * 1000 }
      setStatus('running')
    }
  }, [remainingSeconds, status])

  const stop = useCallback(() => {
    if (status === 'idle') return
    finishSession(false, remainingSeconds)
  }, [finishSession, remainingSeconds, status])

  const requestNotifications = useCallback(() => {
    void requestNotificationPermission().then(setNotificationPermission)
  }, [])

  return {
    status,
    presets: TIMER_PRESETS,
    selectedPresetId,
    customMinutes,
    customLabel,
    displaySeconds,
    progressFraction,
    history,
    isHistoryLoading,
    notificationPermission,
    selectPreset,
    setCustomMinutes,
    setCustomLabel,
    start,
    pauseOrResume,
    stop,
    requestNotifications,
  }
}
