import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_CUSTOM_MINUTES,
  MAX_CUSTOM_MINUTES,
  MIN_CUSTOM_MINUTES,
  MIN_LOGGABLE_SECONDS,
  TICK_INTERVAL_MS,
  TIMER_PRESETS,
} from './TimersTab.constants'
import {
  clampMinutes,
  computeRemainingSeconds,
  createTimerId,
  getPresetTranslationKey,
  sanitizeTimerName,
} from './TimersTab.utils'
import {
  fetchTimerHistory,
  getNotificationPermission,
  getStoredSoundPreference,
  notifyTimerComplete,
  playTickSound,
  postTimerSession,
  requestNotificationPermission,
  setStoredSoundPreference,
  unlockAudio,
} from './useTimersTab.utils'
import type { TimerInstance, TimerPresetId, TimerSession } from './TimersTab.interfaces'

const HISTORY_LIMIT = 50

export function useTimersTab() {
  const { t } = useTranslation()
  const { isSignedIn, getToken } = useAuth()

  const [timers, setTimers] = useState<TimerInstance[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<TimerPresetId>(TIMER_PRESETS[0].id)
  const [draftMinutes, setDraftMinutesState] = useState(DEFAULT_CUSTOM_MINUTES)
  const [nameDraft, setNameDraftState] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [history, setHistory] = useState<TimerSession[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission)
  const [isSoundEnabled, setIsSoundEnabledState] = useState(getStoredSoundPreference)
  const [pendingStopId, setPendingStopId] = useState<string | null>(null)

  // Mirrors `timers` for the interval tick to read without needing to be
  // recreated on every state change (see the tick effect below).
  const timersRef = useRef<TimerInstance[]>(timers)
  useEffect(() => {
    timersRef.current = timers
  }, [timers])

  const hasRunningTimer = timers.some((timer) => timer.status === 'running')

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
  // completed=false takes the elapsed time from whatever remainingSeconds
  // was last ticked to — accurate whether stopped mid-run or while paused
  // (frozen exactly, since no time passes then).
  const finishTimer = useCallback(
    (id: string, completed: boolean) => {
      const timer = timersRef.current.find((candidate) => candidate.id === id)
      if (!timer) return

      setTimers((current) => current.filter((candidate) => candidate.id !== id))

      const elapsedSeconds = completed
        ? timer.plannedSeconds
        : Math.max(0, timer.plannedSeconds - timer.remainingSeconds)

      if (elapsedSeconds >= MIN_LOGGABLE_SECONDS) {
        const session = {
          presetId: timer.presetId,
          label: timer.name,
          plannedSeconds: timer.plannedSeconds,
          actualSeconds: elapsedSeconds,
          completed,
          startedAt: timer.startedAt ?? new Date().toISOString(),
          endedAt: new Date().toISOString(),
        }

        void postTimerSession(session, getToken).then((saved) => {
          if (saved) setHistory((current) => [saved, ...current].slice(0, HISTORY_LIMIT))
        })
      }

      if (completed) {
        const title = t('timers.notification.title')
        const body = timer.name || t(getPresetTranslationKey(timer.presetId))
        void notifyTimerComplete(title, body)
      }
    },
    [getToken, t],
  )

  // Read through a ref rather than depending on `finishTimer` directly below
  // — its identity is only stable as long as `getToken`/`t` are, which isn't
  // guaranteed (Clerk/i18next don't contractually promise it). Depending on
  // it directly would tear down and rebuild the interval on any render where
  // it isn't, which is wasteful at best and, combined with the unconditional
  // setTimers below, a real risk of a render loop at worst.
  const finishTimerRef = useRef(finishTimer)
  useEffect(() => {
    finishTimerRef.current = finishTimer
  }, [finishTimer])

  // One shared interval for every running timer, rather than one per card —
  // each tick re-derives every running instance's remaining time from its
  // own end timestamp, so they can't drift relative to each other either.
  useEffect(() => {
    if (!hasRunningTimer) return

    const tick = () => {
      let crossedASecond = false
      let changed = false
      const completedIds: string[] = []

      const next = timersRef.current.map((timer) => {
        if (timer.status !== 'running' || timer.endTimestampMs == null) return timer
        const remaining = computeRemainingSeconds(timer.endTimestampMs)
        if (remaining === timer.remainingSeconds) return timer

        changed = true
        crossedASecond = true
        if (remaining <= 0) completedIds.push(timer.id)
        return { ...timer, remainingSeconds: remaining }
      })

      // Skip the render entirely when nothing actually moved (most ticks,
      // at a 250ms interval against a 1s-granularity countdown) — cheaper,
      // and keeps this effect's own re-render from ever feeding back into
      // itself.
      if (changed) {
        timersRef.current = next
        setTimers(next)
      }

      if (crossedASecond && isSoundEnabled) playTickSound()
      completedIds.forEach((id) => finishTimerRef.current(id, true))
    }

    tick()
    const intervalId = window.setInterval(tick, TICK_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [hasRunningTimer, isSoundEnabled])

  // Just tags which preset the resulting timer is labeled/translated as —
  // duration is decided separately, in the "Add timer" popup (see
  // openAddDialog), so this no longer touches draftMinutes.
  const selectPreset = useCallback((presetId: TimerPresetId) => setSelectedPresetId(presetId), [])

  const setDraftMinutes = useCallback((minutes: number) => {
    setDraftMinutesState(clampMinutes(minutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES))
  }, [])

  const setNameDraft = useCallback((name: string) => setNameDraftState(name), [])

  // Always resets to DEFAULT_CUSTOM_MINUTES on open, regardless of preset or
  // whatever was left over from the last time the popup was used — the
  // point is to make the user actively choose a duration rather than
  // silently inheriting one.
  const openAddDialog = useCallback(() => {
    setDraftMinutesState(DEFAULT_CUSTOM_MINUTES)
    setIsAddDialogOpen(true)
  }, [])

  const closeAddDialog = useCallback(() => setIsAddDialogOpen(false), [])

  const addTimer = useCallback(() => {
    const plannedSeconds = clampMinutes(draftMinutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES) * 60
    const timer: TimerInstance = {
      id: createTimerId(),
      presetId: selectedPresetId,
      name: sanitizeTimerName(nameDraft),
      plannedSeconds,
      status: 'idle',
      remainingSeconds: plannedSeconds,
      startedAt: null,
      endTimestampMs: null,
    }
    setTimers((current) => [...current, timer])
    setNameDraftState('')
    setIsAddDialogOpen(false)
  }, [draftMinutes, nameDraft, selectedPresetId])

  // Only meaningful for an idle timer — its remainingSeconds always equals
  // plannedSeconds at that point, so both move together. Once a timer has
  // actually started (running/paused), its duration is locked in; the guard
  // is defense in depth since the UI never offers this control then either.
  const updateTimerMinutes = useCallback((id: string, minutes: number) => {
    const plannedSeconds = clampMinutes(minutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES) * 60
    setTimers((current) =>
      current.map((timer) =>
        timer.id === id && timer.status === 'idle'
          ? { ...timer, plannedSeconds, remainingSeconds: plannedSeconds }
          : timer,
      ),
    )
  }, [])

  // Explicit play/pause control on each card: idle/paused → running,
  // running → paused. (Tapping a card used to do this on its own; now the
  // duration area of an idle card is an editable field instead — see
  // MinutesInput — so starting/pausing needs its own dedicated button.)
  const toggleTimer = useCallback((id: string) => {
    unlockAudio()
    setTimers((current) =>
      current.map((timer) => {
        if (timer.id !== id) return timer

        if (timer.status === 'running') {
          return { ...timer, status: 'paused', endTimestampMs: null }
        }

        const now = Date.now()
        return {
          ...timer,
          status: 'running',
          startedAt: timer.startedAt ?? new Date(now).toISOString(),
          endTimestampMs: now + timer.remainingSeconds * 1000,
        }
      }),
    )
  }, [])

  // An untouched idle timer has nothing to lose, so it's removed right
  // away; anything with progress (running or paused) asks for confirmation
  // first via pendingStopId (see confirmStop/cancelStopRequest).
  const requestStop = useCallback((id: string) => {
    const timer = timersRef.current.find((candidate) => candidate.id === id)
    if (!timer) return

    if (timer.status === 'idle') {
      setTimers((current) => current.filter((candidate) => candidate.id !== id))
      return
    }
    setPendingStopId(id)
  }, [])

  const cancelStopRequest = useCallback(() => setPendingStopId(null), [])

  const confirmStop = useCallback(() => {
    if (pendingStopId) finishTimer(pendingStopId, false)
    setPendingStopId(null)
  }, [pendingStopId, finishTimer])

  const requestNotifications = useCallback(() => {
    void requestNotificationPermission().then(setNotificationPermission)
  }, [])

  const toggleSound = useCallback(() => {
    setIsSoundEnabledState((current) => {
      const next = !current
      setStoredSoundPreference(next)
      if (next) unlockAudio()
      return next
    })
  }, [])

  return {
    timers,
    presets: TIMER_PRESETS,
    selectedPresetId,
    draftMinutes,
    nameDraft,
    isAddDialogOpen,
    history,
    isHistoryLoading,
    notificationPermission,
    isSoundEnabled,
    pendingStopId,
    selectPreset,
    setDraftMinutes,
    setNameDraft,
    openAddDialog,
    closeAddDialog,
    addTimer,
    updateTimerMinutes,
    toggleTimer,
    requestStop,
    cancelStopRequest,
    confirmStop,
    requestNotifications,
    toggleSound,
  }
}
