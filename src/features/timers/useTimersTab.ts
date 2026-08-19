import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import {
  DEFAULT_CUSTOM_MINUTES,
  DEFAULT_POMODORO_BREAK_MINUTES,
  DEFAULT_POMODORO_FOCUS_MINUTES,
  MAX_CUSTOM_MINUTES,
  MIN_CUSTOM_MINUTES,
  MIN_LOGGABLE_SECONDS,
  POMODORO_PRESET_ID,
  TICK_INTERVAL_MS,
  TIMER_PRESETS,
} from './TimersTab.constants'
import {
  addMinutesToTimerInstance,
  buildTaskLinkOptions,
  clampMinutes,
  computeRemainingSeconds,
  createTimerId,
  getActivePresetId,
  getPhaseTranslationKey,
  getPresetDefaultMinutes,
  getPresetTranslationKey,
  sanitizeTimerName,
} from './TimersTab.utils'
import {
  fetchTimerHistory,
  getNotificationPermission,
  getStoredSoundPreference,
  notifyTimerComplete,
  playChimeSound,
  playTickSound,
  postTimerSession,
  requestNotificationPermission,
  setStoredSoundPreference,
  unlockAudio,
} from './useTimersTab.utils'
import type { TaskLinkOption } from './TaskLinkPicker/TaskLinkPicker.interfaces'
import type {
  TimerInstance,
  TimerPresetId,
  TimerSession,
  TimerTaskLink,
} from './TimersTab.interfaces'
import { fetchTasks } from '@/features/tasks/useTasksTab.utils'

/** Narrows a picked TaskLinkPicker option (which also carries a `key` for
 * React/Autocomplete identity) down to the plain {taskId, subtaskId, label}
 * shape a TimerInstance/session actually stores. */
function toTaskLink(option: TaskLinkOption | null): TimerTaskLink | null {
  if (!option) return null
  return { taskId: option.taskId, subtaskId: option.subtaskId, label: option.label }
}

/** Prefill carried by a "Start a Pomodoro now" navigation from the AI Chat
 * plan preview (see PlanPreviewCard/useAiChatTab.ts's startPomodoroFromPlan)
 * — read once from router state on mount, the same one-shot-deep-link
 * pattern as useAiChatTab.ts's own conversationId consumption. */
interface PomodoroPrefillState {
  startPomodoro?: {
    label: string
    focusMinutes: number
    breakMinutes: number
  }
}

const HISTORY_LIMIT = 50

export function useTimersTab() {
  const { t } = useTranslation()
  const { isSignedIn, getToken } = useAuth()
  const location = useLocation()

  const [timers, setTimers] = useState<TimerInstance[]>([])
  // The 4-preset toggle row is now the tab's *secondary* path — Pomodoro
  // has its own dedicated primary CTA (openPomodoroDialog below) and is
  // deliberately not one of these anymore, so this starts on the first of
  // the remaining ones instead of TIMER_PRESETS[0] (still pomodoro-focus,
  // kept as-is for history/Dashboard categorization).
  const [selectedPresetId, setSelectedPresetId] = useState<TimerPresetId>('short-break')
  const [draftMinutes, setDraftMinutesState] = useState(DEFAULT_CUSTOM_MINUTES)
  const [nameDraft, setNameDraftState] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  // Collapsed by default — "fewer decisions before starting" is the whole
  // point of making Pomodoro the obvious first move; the other preset
  // options are still one tap away, just not competing for attention.
  const [isOtherTimersOpen, setIsOtherTimersOpen] = useState(false)
  const [pomodoroFocusMinutes, setPomodoroFocusMinutesState] = useState(
    DEFAULT_POMODORO_FOCUS_MINUTES,
  )
  const [pomodoroBreakMinutes, setPomodoroBreakMinutesState] = useState(
    DEFAULT_POMODORO_BREAK_MINUTES,
  )
  const [isPomodoroDialogOpen, setIsPomodoroDialogOpen] = useState(false)
  const [taskLinkOptions, setTaskLinkOptions] = useState<TaskLinkOption[]>([])
  const [taskLink, setTaskLinkState] = useState<TaskLinkOption | null>(null)
  const [history, setHistory] = useState<TimerSession[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission)
  const [isSoundEnabled, setIsSoundEnabledState] = useState(getStoredSoundPreference)
  const [pendingStopId, setPendingStopId] = useState<string | null>(null)

  // Mirrors `timers` for the interval tick (and anything else reading
  // synchronously mid-tick, like advancePhaseOrFinish below) without
  // needing to be recreated on every state change.
  const timersRef = useRef<TimerInstance[]>(timers)
  useEffect(() => {
    timersRef.current = timers
  }, [timers])

  // The single way `timers` ever gets mutated — computes the next array from
  // `timersRef.current` (not React's own `current` updater argument) and
  // assigns it to the ref *synchronously*, before also pushing it through
  // `setTimers`. This matters because a Pomodoro can complete two phases
  // within the same tick-driven interval burst (focus running out, then,
  // moments later in simulated time, break running out too): without an
  // immediately-synced ref, the second completion would still see the first
  // phase's now-stale endTimestampMs/remainingSeconds and silently do
  // nothing, since React only flushes the render (and the separate
  // `timersRef.current = timers` effect above) once the whole burst settles,
  // not between individual setState calls inside it.
  const applyTimers = useCallback((updater: (current: TimerInstance[]) => TimerInstance[]) => {
    const next = updater(timersRef.current)
    timersRef.current = next
    setTimers(next)
  }, [])

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

  // Feeds the optional "what are you working on?" picker in the Add
  // timer/Pomodoro dialogs — a plain best-effort fetch (see fetchTasks),
  // not re-run on every dialog open, so the list is whatever it was as of
  // this tab's mount rather than always perfectly fresh; acceptable for an
  // optional, low-stakes picker.
  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false
    void fetchTasks(getToken).then((tasks) => {
      if (cancelled) return
      setTaskLinkOptions(buildTaskLinkOptions(tasks))
    })
    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken])

  // Builds and posts the session payload for whichever phase is currently
  // active (or the whole timer, for a plain one) — shared by both a manual
  // stop and a natural phase completion. `completed=true` always means "ran
  // out naturally" (elapsed === the active phase's planned seconds);
  // `completed=false` takes the elapsed time from wherever remainingSeconds
  // was last ticked to, accurate whether stopped mid-run or while paused
  // (frozen exactly, since no time passes then).
  const logSession = useCallback(
    (timer: TimerInstance, completed: boolean) => {
      const elapsedSeconds = completed
        ? timer.plannedSeconds
        : Math.max(0, timer.plannedSeconds - timer.remainingSeconds)
      if (elapsedSeconds < MIN_LOGGABLE_SECONDS) return

      const session = {
        presetId: getActivePresetId(timer),
        label: timer.name,
        plannedSeconds: timer.plannedSeconds,
        actualSeconds: elapsedSeconds,
        completed,
        startedAt: timer.startedAt ?? new Date().toISOString(),
        endedAt: new Date().toISOString(),
        taskId: timer.taskLink?.taskId ?? null,
        subtaskId: timer.taskLink?.subtaskId ?? null,
        taskLabel: timer.taskLink?.label ?? null,
      }

      void postTimerSession(session, getToken).then((saved) => {
        if (saved) setHistory((current) => [saved, ...current].slice(0, HISTORY_LIMIT))
      })
    },
    [getToken],
  )

  // A manual stop always ends the whole timer, whichever phase it's on —
  // stopping a Pomodoro mid-break doesn't try to "finish" it, it just ends
  // it there, logging only the partial current phase (any earlier phase was
  // already logged for real when it completed naturally, see
  // advancePhaseOrFinish below).
  const stopTimer = useCallback(
    (id: string) => {
      const timer = timersRef.current.find((candidate) => candidate.id === id)
      if (!timer) return
      applyTimers((current) => current.filter((candidate) => candidate.id !== id))
      logSession(timer, false)
    },
    [logSession, applyTimers],
  )

  // Called when a running timer's countdown naturally reaches zero. A plain
  // timer (no `phases`) always finishes here. A Pomodoro timer instead
  // advances to its next phase in place (keeping the card, resetting the
  // countdown) until there isn't one, at which point it finishes too — that
  // last phase is what "termina" (the Pomodoro is done) refers to.
  const advancePhaseOrFinish = useCallback(
    (id: string) => {
      const timer = timersRef.current.find((candidate) => candidate.id === id)
      if (!timer) return

      logSession(timer, true)

      const nextPhase = timer.phases?.[(timer.phaseIndex ?? 0) + 1]
      if (!nextPhase) {
        applyTimers((current) => current.filter((candidate) => candidate.id !== id))
        const activeLabel = timer.name || t(getPresetTranslationKey(getActivePresetId(timer)))
        void notifyTimerComplete(t('timers.notification.title'), activeLabel)
        if (timer.phases) playChimeSound()
        return
      }

      const now = Date.now()
      applyTimers((current) =>
        current.map((candidate) =>
          candidate.id === id
            ? {
                ...candidate,
                phaseIndex: (candidate.phaseIndex ?? 0) + 1,
                plannedSeconds: nextPhase.seconds,
                remainingSeconds: nextPhase.seconds,
                startedAt: new Date(now).toISOString(),
                endTimestampMs: now + nextPhase.seconds * 1000,
              }
            : candidate,
        ),
      )
      playChimeSound()
      void notifyTimerComplete(
        t('timers.pomodoro.phaseCompleteTitle'),
        t('timers.pomodoro.phaseCompleteBody', {
          phase: t(getPhaseTranslationKey(nextPhase.kind)),
          minutes: Math.round(nextPhase.seconds / 60),
        }),
      )
    },
    [logSession, t, applyTimers],
  )

  // Read through a ref rather than depending on `advancePhaseOrFinish`
  // directly below — its identity is only stable as long as
  // `getToken`/`t` are, which isn't guaranteed (Clerk/i18next don't
  // contractually promise it). Depending on it directly would tear down and
  // rebuild the interval on any render where it isn't, which is wasteful at
  // best and, combined with the unconditional setTimers below, a real risk
  // of a render loop at worst.
  const advancePhaseOrFinishRef = useRef(advancePhaseOrFinish)
  useEffect(() => {
    advancePhaseOrFinishRef.current = advancePhaseOrFinish
  }, [advancePhaseOrFinish])

  // One shared interval for every running timer, rather than one per card —
  // each tick re-derives every running instance's remaining time from its
  // own end timestamp, so they can't drift relative to each other either.
  useEffect(() => {
    if (!hasRunningTimer) return

    const tick = () => {
      let simpleTimerCrossedASecond = false
      let changed = false
      const completedIds: string[] = []

      const next = timersRef.current.map((timer) => {
        if (timer.status !== 'running' || timer.endTimestampMs == null) return timer
        const remaining = computeRemainingSeconds(timer.endTimestampMs)
        if (remaining === timer.remainingSeconds) return timer

        changed = true
        // A Pomodoro deliberately has no ambient per-second tick (see
        // playChimeSound's doc comment) — only a plain timer's crossing
        // counts toward the shared tick sound below.
        if (!timer.phases) simpleTimerCrossedASecond = true
        if (remaining <= 0) completedIds.push(timer.id)
        return { ...timer, remainingSeconds: remaining }
      })

      // Skip the render entirely when nothing actually moved (most ticks,
      // at a 250ms interval against a 1s-granularity countdown) — cheaper,
      // and keeps this effect's own re-render from ever feeding back into
      // itself.
      if (changed) applyTimers(() => next)

      if (simpleTimerCrossedASecond && isSoundEnabled) playTickSound()
      completedIds.forEach((id) => advancePhaseOrFinishRef.current(id))
    }

    tick()
    const intervalId = window.setInterval(tick, TICK_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [hasRunningTimer, isSoundEnabled, applyTimers])

  // Just tags which preset the resulting timer is labeled/translated as —
  // duration is decided separately, in whichever popup "Add timer" opens
  // (see openAddDialog), so this no longer touches draftMinutes.
  const selectPreset = useCallback((presetId: TimerPresetId) => setSelectedPresetId(presetId), [])

  const setDraftMinutes = useCallback((minutes: number) => {
    setDraftMinutesState(clampMinutes(minutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES))
  }, [])

  const setPomodoroFocusMinutes = useCallback((minutes: number) => {
    setPomodoroFocusMinutesState(clampMinutes(minutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES))
  }, [])

  const setPomodoroBreakMinutes = useCallback((minutes: number) => {
    setPomodoroBreakMinutesState(clampMinutes(minutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES))
  }, [])

  const setNameDraft = useCallback((name: string) => setNameDraftState(name), [])
  const setTaskLink = useCallback((option: TaskLinkOption | null) => setTaskLinkState(option), [])
  const toggleOtherTimers = useCallback(() => setIsOtherTimersOpen((current) => !current), [])

  // The tab's primary CTA — always opens the Pomodoro dialog directly,
  // defaulting to the classic 20/10 split, regardless of whichever preset
  // is selected in the (now secondary, collapsed-by-default) preset row
  // below. Decoupled from openAddDialog/selectedPresetId entirely so
  // reaching Pomodoro never depends on first picking it from a row of
  // options — see ROADMAP.md's "Timers tab rethink" note.
  const openPomodoroDialog = useCallback(() => {
    setNameDraftState('')
    setTaskLinkState(null)
    setPomodoroFocusMinutesState(DEFAULT_POMODORO_FOCUS_MINUTES)
    setPomodoroBreakMinutesState(DEFAULT_POMODORO_BREAK_MINUTES)
    setIsPomodoroDialogOpen(true)
  }, [])

  // The secondary "other timer options" row's "Add timer" button — short
  // break/long break/custom open the plain duration popup, prefilled with
  // that preset's suggested minutes (custom has none of its own, so it
  // falls back to DEFAULT_CUSTOM_MINUTES) — always reset on open, regardless
  // of whatever was left over from last time, so the user actively confirms
  // a duration rather than silently inheriting one. The name/task-link
  // drafts reset to empty here too, now that they're set inside whichever
  // popup opens rather than in the always-visible composer. Focus/Pomodoro
  // is no longer reachable through this path at all (selectedPresetId can
  // no longer be POMODORO_PRESET_ID — see its initial state above), but the
  // branch is kept as defense in depth rather than assumed unreachable.
  const openAddDialog = useCallback(() => {
    setNameDraftState('')
    setTaskLinkState(null)
    if (selectedPresetId === POMODORO_PRESET_ID) {
      setPomodoroFocusMinutesState(DEFAULT_POMODORO_FOCUS_MINUTES)
      setPomodoroBreakMinutesState(DEFAULT_POMODORO_BREAK_MINUTES)
      setIsPomodoroDialogOpen(true)
      return
    }
    setDraftMinutesState(getPresetDefaultMinutes(selectedPresetId))
    setIsAddDialogOpen(true)
  }, [selectedPresetId])

  const closeAddDialog = useCallback(() => setIsAddDialogOpen(false), [])
  const closePomodoroDialog = useCallback(() => setIsPomodoroDialogOpen(false), [])

  // Consumes a "Start a Pomodoro now" navigation from the AI Chat plan
  // preview (see PomodoroPrefillState above) — one-shot per mount via a ref
  // guard, same pattern as useAiChatTab.ts's own conversationId deep link,
  // so navigating away and back doesn't reopen the dialog on every render.
  const consumedPomodoroPrefillRef = useRef(false)
  useEffect(() => {
    if (consumedPomodoroPrefillRef.current) return
    const state = location.state as PomodoroPrefillState | null
    const prefill = state?.startPomodoro
    if (!prefill) return
    consumedPomodoroPrefillRef.current = true

    setNameDraftState(prefill.label)
    setTaskLinkState(null)
    setPomodoroFocusMinutesState(
      clampMinutes(prefill.focusMinutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES),
    )
    setPomodoroBreakMinutesState(
      clampMinutes(prefill.breakMinutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES),
    )
    setIsPomodoroDialogOpen(true)
  }, [location.state])

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
      taskLink: toTaskLink(taskLink),
    }
    applyTimers((current) => [...current, timer])
    setNameDraftState('')
    setTaskLinkState(null)
    setIsAddDialogOpen(false)
  }, [draftMinutes, nameDraft, selectedPresetId, taskLink, applyTimers])

  const confirmPomodoro = useCallback(() => {
    const focusSeconds =
      clampMinutes(pomodoroFocusMinutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES) * 60
    const breakSeconds =
      clampMinutes(pomodoroBreakMinutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES) * 60
    const timer: TimerInstance = {
      id: createTimerId(),
      presetId: POMODORO_PRESET_ID,
      name: sanitizeTimerName(nameDraft),
      plannedSeconds: focusSeconds,
      status: 'idle',
      remainingSeconds: focusSeconds,
      startedAt: null,
      endTimestampMs: null,
      phases: [
        { kind: 'focus', seconds: focusSeconds },
        { kind: 'break', seconds: breakSeconds },
      ],
      phaseIndex: 0,
      taskLink: toTaskLink(taskLink),
    }
    applyTimers((current) => [...current, timer])
    setNameDraftState('')
    setTaskLinkState(null)
    setIsPomodoroDialogOpen(false)
  }, [pomodoroFocusMinutes, pomodoroBreakMinutes, nameDraft, taskLink, applyTimers])

  // Only meaningful for an idle timer — its remainingSeconds always equals
  // plannedSeconds at that point, so both move together. Once a timer has
  // actually started (running/paused), its duration is locked in; the guard
  // is defense in depth since the UI never offers this control then either.
  // For an idle Pomodoro (always sitting on its first, focus phase — the
  // second only ever becomes active once running), this edits that phase.
  const updateTimerMinutes = useCallback(
    (id: string, minutes: number) => {
      const seconds = clampMinutes(minutes, MIN_CUSTOM_MINUTES, MAX_CUSTOM_MINUTES) * 60
      applyTimers((current) =>
        current.map((timer) => {
          if (timer.id !== id || timer.status !== 'idle') return timer
          if (timer.phases) {
            const phaseIndex = timer.phaseIndex ?? 0
            const phases = timer.phases.map((phase, index) =>
              index === phaseIndex ? { ...phase, seconds } : phase,
            )
            return { ...timer, plannedSeconds: seconds, remainingSeconds: seconds, phases }
          }
          return { ...timer, plannedSeconds: seconds, remainingSeconds: seconds }
        }),
      )
    },
    [applyTimers],
  )

  // Lets a running/paused card's "add minutes" button extend it in place —
  // guarded on status here too (not just by the UI only rendering the button
  // for a non-idle card) since an idle timer already has its own free-form
  // MinutesInput for setting an exact duration instead.
  const addMinutesToTimer = useCallback(
    (id: string, minutesToAdd: number) => {
      applyTimers((current) =>
        current.map((timer) =>
          timer.id === id && timer.status !== 'idle'
            ? addMinutesToTimerInstance(timer, minutesToAdd)
            : timer,
        ),
      )
    },
    [applyTimers],
  )

  // Explicit play/pause control on each card: idle/paused → running,
  // running → paused. (Tapping a card used to do this on its own; now the
  // duration area of an idle card is an editable field instead — see
  // MinutesInput — so starting/pausing needs its own dedicated button.)
  const toggleTimer = useCallback(
    (id: string) => {
      unlockAudio()
      applyTimers((current) =>
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
    },
    [applyTimers],
  )

  // An untouched idle timer has nothing to lose, so it's removed right
  // away; anything with progress (running or paused) asks for confirmation
  // first via pendingStopId (see confirmStop/cancelStopRequest).
  const requestStop = useCallback(
    (id: string) => {
      const timer = timersRef.current.find((candidate) => candidate.id === id)
      if (!timer) return

      if (timer.status === 'idle') {
        applyTimers((current) => current.filter((candidate) => candidate.id !== id))
        return
      }
      setPendingStopId(id)
    },
    [applyTimers],
  )

  const cancelStopRequest = useCallback(() => setPendingStopId(null), [])

  const confirmStop = useCallback(() => {
    if (pendingStopId) stopTimer(pendingStopId)
    setPendingStopId(null)
  }, [pendingStopId, stopTimer])

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
    // Secondary preset row — Pomodoro has its own primary CTA (below) and is
    // deliberately excluded here, see selectedPresetId's initial state.
    secondaryPresets: TIMER_PRESETS.filter((preset) => preset.id !== POMODORO_PRESET_ID),
    selectedPresetId,
    draftMinutes,
    nameDraft,
    isAddDialogOpen,
    isOtherTimersOpen,
    pomodoroFocusMinutes,
    pomodoroBreakMinutes,
    isPomodoroDialogOpen,
    taskLinkOptions,
    taskLink,
    history,
    isHistoryLoading,
    notificationPermission,
    isSoundEnabled,
    pendingStopId,
    selectPreset,
    setDraftMinutes,
    setNameDraft,
    setTaskLink,
    toggleOtherTimers,
    openPomodoroDialog,
    openAddDialog,
    closeAddDialog,
    addTimer,
    setPomodoroFocusMinutes,
    setPomodoroBreakMinutes,
    closePomodoroDialog,
    confirmPomodoro,
    updateTimerMinutes,
    addMinutesToTimer,
    toggleTimer,
    requestStop,
    cancelStopRequest,
    confirmStop,
    requestNotifications,
    toggleSound,
  }
}
