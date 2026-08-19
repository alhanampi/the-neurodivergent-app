import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useTimersTab } from './useTimersTab'

const mockGetToken = vi.fn(async () => 'token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn: true, getToken: mockGetToken }),
}))

const mockFetchTimerHistory = vi.fn(async (_getToken: unknown) => [])
const mockPostTimerSession = vi.fn(async (session: unknown, _getToken: unknown) => ({
  id: 1,
  ...(session as object),
}))
const mockGetNotificationPermission = vi.fn(() => 'default' as const)
const mockRequestNotificationPermission = vi.fn(async () => 'granted' as const)
const mockNotifyTimerComplete = vi.fn(async (_title: unknown, _body: unknown) => {})
const mockGetStoredSoundPreference = vi.fn(() => false)
const mockSetStoredSoundPreference = vi.fn((_enabled: boolean) => {})
const mockUnlockAudio = vi.fn(() => {})
const mockPlayTickSound = vi.fn(() => {})
const mockPlayChimeSound = vi.fn(() => {})

vi.mock('./useTimersTab.utils', () => ({
  fetchTimerHistory: (getToken: unknown) => mockFetchTimerHistory(getToken),
  postTimerSession: (session: unknown, getToken: unknown) =>
    mockPostTimerSession(session, getToken),
  getNotificationPermission: () => mockGetNotificationPermission(),
  requestNotificationPermission: () => mockRequestNotificationPermission(),
  notifyTimerComplete: (title: unknown, body: unknown) => mockNotifyTimerComplete(title, body),
  getStoredSoundPreference: () => mockGetStoredSoundPreference(),
  setStoredSoundPreference: (enabled: boolean) => mockSetStoredSoundPreference(enabled),
  unlockAudio: () => mockUnlockAudio(),
  playTickSound: () => mockPlayTickSound(),
  playChimeSound: () => mockPlayChimeSound(),
}))

const mockFetchTasks = vi.fn(async (_getToken: unknown) => [] as unknown[])
vi.mock('@/features/tasks/useTasksTab.utils', () => ({
  fetchTasks: (getToken: unknown) => mockFetchTasks(getToken),
}))

// useTimersTab reads router state (for the "Start a Pomodoro now" deep link
// from AI Chat) via useLocation, which throws outside a Router — same
// wrapper pattern as useTasksTab.test.ts's own renderTasksHook.
function renderTimersHook() {
  return renderHook(() => useTimersTab(), { wrapper: MemoryRouter })
}

describe('useTimersTab', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetchTimerHistory.mockClear()
    mockPostTimerSession.mockClear()
    mockNotifyTimerComplete.mockClear()
    mockGetToken.mockClear()
    mockSetStoredSoundPreference.mockClear()
    mockUnlockAudio.mockClear()
    mockPlayTickSound.mockClear()
    mockPlayChimeSound.mockClear()
    mockGetStoredSoundPreference.mockReturnValue(false)
    mockFetchTasks.mockClear()
    mockFetchTasks.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no timers, the first secondary preset selected, and both dialogs closed', () => {
    const { result } = renderTimersHook()

    expect(result.current.timers).toEqual([])
    // Pomodoro isn't among the secondary presets — it has its own primary
    // CTA (openPomodoroDialog) instead. See secondaryPresets' doc comment.
    expect(result.current.selectedPresetId).toBe('short-break')
    expect(result.current.isAddDialogOpen).toBe(false)
    expect(result.current.isPomodoroDialogOpen).toBe(false)
  })

  it('the primary CTA opens the Pomodoro dialog directly, defaulting to 20/10, regardless of the secondary selection', () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('long-break'))
    act(() => result.current.setPomodoroFocusMinutes(90))
    act(() => result.current.setPomodoroBreakMinutes(90))
    act(() => result.current.openPomodoroDialog())

    expect(result.current.isPomodoroDialogOpen).toBe(true)
    expect(result.current.isAddDialogOpen).toBe(false)
    expect(result.current.pomodoroFocusMinutes).toBe(20)
    expect(result.current.pomodoroBreakMinutes).toBe(10)
  })

  it("opening the Add dialog resets the draft duration to the selected preset's suggested default", () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('long-break'))
    act(() => result.current.setDraftMinutes(90))
    act(() => result.current.openAddDialog())

    expect(result.current.isAddDialogOpen).toBe(true)
    expect(result.current.draftMinutes).toBe(15)
  })

  it("the Custom preset's Add dialog still defaults to 10 minutes", () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('custom'))
    act(() => result.current.openAddDialog())

    expect(result.current.draftMinutes).toBe(10)
  })

  it('opening the Add dialog resets the name draft, same as the duration', () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('custom'))
    act(() => result.current.openAddDialog())
    act(() => result.current.setNameDraft('Fold laundry'))
    act(() => result.current.closeAddDialog())
    act(() => result.current.openAddDialog())

    expect(result.current.nameDraft).toBe('')
  })

  it('opening the Add dialog while Focus is selected in the secondary row still opens the Pomodoro dialog (defense in depth)', () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('pomodoro-focus'))
    act(() => result.current.setPomodoroFocusMinutes(90))
    act(() => result.current.setPomodoroBreakMinutes(90))
    act(() => result.current.openAddDialog())

    expect(result.current.isPomodoroDialogOpen).toBe(true)
    expect(result.current.isAddDialogOpen).toBe(false)
    expect(result.current.pomodoroFocusMinutes).toBe(20)
    expect(result.current.pomodoroBreakMinutes).toBe(10)
  })

  it('closing the Add dialog without confirming adds nothing', () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('custom'))
    act(() => result.current.openAddDialog())
    expect(result.current.isAddDialogOpen).toBe(true)
    act(() => result.current.closeAddDialog())

    expect(result.current.isAddDialogOpen).toBe(false)
    expect(result.current.timers).toEqual([])
  })

  it('closing the Pomodoro dialog without confirming adds nothing', () => {
    const { result } = renderTimersHook()

    act(() => result.current.openPomodoroDialog())
    expect(result.current.isPomodoroDialogOpen).toBe(true)
    act(() => result.current.closePomodoroDialog())

    expect(result.current.isPomodoroDialogOpen).toBe(false)
    expect(result.current.timers).toEqual([])
  })

  it('adds an idle timer, clears the name draft, and closes the dialog', () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('custom'))
    act(() => result.current.openAddDialog())
    act(() => result.current.setNameDraft('Fold laundry'))
    act(() => result.current.setDraftMinutes(12))
    act(() => result.current.addTimer())

    expect(result.current.timers).toHaveLength(1)
    expect(result.current.timers[0]).toMatchObject({
      presetId: 'custom',
      name: 'Fold laundry',
      plannedSeconds: 12 * 60,
      status: 'idle',
      remainingSeconds: 12 * 60,
    })
    expect(result.current.nameDraft).toBe('')
    expect(result.current.isAddDialogOpen).toBe(false)
  })

  it('supports multiple concurrent timers ticking independently', () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('short-break'))
    act(() => result.current.setDraftMinutes(5))
    act(() => result.current.addTimer())
    act(() => result.current.selectPreset('long-break'))
    act(() => result.current.setDraftMinutes(15))
    act(() => result.current.addTimer())

    expect(result.current.timers).toHaveLength(2)
    const [first, second] = result.current.timers

    act(() => result.current.toggleTimer(first.id))
    act(() => vi.advanceTimersByTime(5000))

    const running = result.current.timers.find((timer) => timer.id === first.id)
    const stillIdle = result.current.timers.find((timer) => timer.id === second.id)
    expect(running?.status).toBe('running')
    expect(running?.remainingSeconds).toBeLessThan(5 * 60)
    expect(stillIdle?.status).toBe('idle')
    expect(stillIdle?.remainingSeconds).toBe(15 * 60)
  })

  it('toggling pauses a running timer and resumes a paused one', () => {
    const { result } = renderTimersHook()

    act(() => result.current.addTimer())
    const id = result.current.timers[0].id

    act(() => result.current.toggleTimer(id))
    act(() => vi.advanceTimersByTime(3000))
    act(() => result.current.toggleTimer(id))

    const paused = result.current.timers.find((timer) => timer.id === id)
    expect(paused?.status).toBe('paused')
    const frozen = paused?.remainingSeconds

    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.timers.find((timer) => timer.id === id)?.remainingSeconds).toBe(frozen)

    act(() => result.current.toggleTimer(id))
    expect(result.current.timers.find((timer) => timer.id === id)?.status).toBe('running')
  })

  it('removes an untouched idle timer immediately, without a confirmation prompt', () => {
    const { result } = renderTimersHook()

    act(() => result.current.addTimer())
    const id = result.current.timers[0].id

    act(() => result.current.requestStop(id))

    expect(result.current.timers).toHaveLength(0)
    expect(result.current.pendingStopId).toBeNull()
    expect(mockPostTimerSession).not.toHaveBeenCalled()
  })

  it('asks for confirmation before stopping a running timer, and only removes it on confirm', () => {
    const { result } = renderTimersHook()

    act(() => result.current.addTimer())
    const id = result.current.timers[0].id
    act(() => result.current.toggleTimer(id))
    act(() => vi.advanceTimersByTime(10_000))

    act(() => result.current.requestStop(id))
    expect(result.current.pendingStopId).toBe(id)
    expect(result.current.timers).toHaveLength(1)

    act(() => result.current.cancelStopRequest())
    expect(result.current.pendingStopId).toBeNull()
    expect(result.current.timers).toHaveLength(1)

    act(() => result.current.requestStop(id))
    act(() => result.current.confirmStop())

    expect(result.current.pendingStopId).toBeNull()
    expect(result.current.timers).toHaveLength(0)
    expect(mockPostTimerSession).toHaveBeenCalledTimes(1)
    const [session] = mockPostTimerSession.mock.calls[0] as unknown as [
      { completed: boolean; actualSeconds: number },
    ]
    expect(session.completed).toBe(false)
    expect(session.actualSeconds).toBeGreaterThanOrEqual(9)
  })

  it('does not log stopping a timer with negligible elapsed time', () => {
    const { result } = renderTimersHook()

    act(() => result.current.addTimer())
    const id = result.current.timers[0].id
    act(() => result.current.toggleTimer(id))
    act(() => vi.advanceTimersByTime(1000))

    act(() => result.current.requestStop(id))
    act(() => result.current.confirmStop())

    expect(mockPostTimerSession).not.toHaveBeenCalled()
  })

  it('edits an idle timer duration, but leaves a running one alone', () => {
    const { result } = renderTimersHook()

    act(() => result.current.addTimer())
    act(() => result.current.addTimer())
    const [idleId, runningId] = result.current.timers.map((timer) => timer.id)
    act(() => result.current.toggleTimer(runningId))

    act(() => result.current.updateTimerMinutes(idleId, 45))
    act(() => result.current.updateTimerMinutes(runningId, 45))

    const idleTimer = result.current.timers.find((timer) => timer.id === idleId)
    const runningTimer = result.current.timers.find((timer) => timer.id === runningId)
    expect(idleTimer?.plannedSeconds).toBe(45 * 60)
    expect(idleTimer?.remainingSeconds).toBe(45 * 60)
    expect(runningTimer?.plannedSeconds).toBe(10 * 60)
  })

  it('adds minutes to a running timer, extending both its planned and remaining time', () => {
    const { result } = renderTimersHook()

    act(() => result.current.addTimer())
    const id = result.current.timers[0].id
    act(() => result.current.toggleTimer(id))
    act(() => vi.advanceTimersByTime(5000))

    const beforeRemaining = result.current.timers[0].remainingSeconds
    act(() => result.current.addMinutesToTimer(id, 5))

    const timer = result.current.timers[0]
    expect(timer.plannedSeconds).toBe(15 * 60)
    expect(timer.remainingSeconds).toBe(beforeRemaining + 5 * 60)
    // Still running, still counting down from the extended total — not reset.
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.timers[0].remainingSeconds).toBeLessThan(timer.remainingSeconds)
  })

  it('adds minutes to a paused timer too, but leaves an idle one alone', () => {
    const { result } = renderTimersHook()

    act(() => result.current.addTimer())
    const id = result.current.timers[0].id

    act(() => result.current.addMinutesToTimer(id, 5))
    expect(result.current.timers[0].plannedSeconds).toBe(10 * 60)

    act(() => result.current.toggleTimer(id))
    act(() => result.current.toggleTimer(id))
    expect(result.current.timers[0].status).toBe('paused')

    act(() => result.current.addMinutesToTimer(id, 5))
    expect(result.current.timers[0].plannedSeconds).toBe(15 * 60)
    expect(result.current.timers[0].remainingSeconds).toBe(15 * 60)
  })

  it('auto-completes, logs completed:true, and notifies once a timer runs out', () => {
    const { result } = renderTimersHook()

    act(() => result.current.selectPreset('custom'))
    act(() => result.current.setDraftMinutes(1))
    act(() => result.current.addTimer())
    const id = result.current.timers[0].id
    act(() => result.current.toggleTimer(id))
    act(() => vi.advanceTimersByTime(60_000))

    expect(result.current.timers).toHaveLength(0)
    expect(mockPostTimerSession).toHaveBeenCalledTimes(1)
    const [session] = mockPostTimerSession.mock.calls[0] as unknown as [{ completed: boolean }]
    expect(session.completed).toBe(true)
    expect(mockNotifyTimerComplete).toHaveBeenCalledTimes(1)
  })

  it('plays a tick sound each second while sound is enabled and a timer is running', () => {
    mockGetStoredSoundPreference.mockReturnValue(true)
    const { result } = renderTimersHook()

    expect(result.current.isSoundEnabled).toBe(true)

    act(() => result.current.addTimer())
    act(() => result.current.toggleTimer(result.current.timers[0].id))
    act(() => vi.advanceTimersByTime(2500))

    expect(mockPlayTickSound).toHaveBeenCalled()
  })

  it('does not play a tick sound when sound is disabled', () => {
    const { result } = renderTimersHook()

    act(() => result.current.addTimer())
    act(() => result.current.toggleTimer(result.current.timers[0].id))
    act(() => vi.advanceTimersByTime(2500))

    expect(mockPlayTickSound).not.toHaveBeenCalled()
  })

  it('toggleSound flips state, persists it, and unlocks audio when turning on', () => {
    const { result } = renderTimersHook()

    act(() => result.current.toggleSound())

    expect(result.current.isSoundEnabled).toBe(true)
    expect(mockSetStoredSoundPreference).toHaveBeenCalledWith(true)
    expect(mockUnlockAudio).toHaveBeenCalled()
  })

  it('requests notification permission on demand', async () => {
    const { result } = renderTimersHook()

    await act(async () => {
      result.current.requestNotifications()
      await Promise.resolve()
    })

    expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1)
    expect(result.current.notificationPermission).toBe('granted')
  })

  describe('Pomodoro timers', () => {
    it('confirmPomodoro creates a two-phase timer, clears the name draft, and closes the dialog', () => {
      const { result } = renderTimersHook()

      act(() => result.current.openPomodoroDialog())
      act(() => result.current.setNameDraft('Deep work'))
      act(() => result.current.setPomodoroFocusMinutes(1))
      act(() => result.current.setPomodoroBreakMinutes(1))
      act(() => result.current.confirmPomodoro())

      expect(result.current.timers).toHaveLength(1)
      const timer = result.current.timers[0]
      expect(timer).toMatchObject({
        presetId: 'pomodoro-focus',
        name: 'Deep work',
        status: 'idle',
        plannedSeconds: 60,
        remainingSeconds: 60,
        phaseIndex: 0,
      })
      expect(timer.phases).toEqual([
        { kind: 'focus', seconds: 60 },
        { kind: 'break', seconds: 60 },
      ])
      expect(result.current.nameDraft).toBe('')
      expect(result.current.isPomodoroDialogOpen).toBe(false)
    })

    it('auto-advances from focus to break when the focus phase runs out, keeping the card and logging a focus session', () => {
      const { result } = renderTimersHook()

      act(() => result.current.openPomodoroDialog())
      act(() => result.current.setPomodoroFocusMinutes(1))
      act(() => result.current.setPomodoroBreakMinutes(1))
      act(() => result.current.confirmPomodoro())
      const id = result.current.timers[0].id

      act(() => result.current.toggleTimer(id))
      act(() => vi.advanceTimersByTime(60_000))

      expect(result.current.timers).toHaveLength(1)
      const timer = result.current.timers.find((candidate) => candidate.id === id)
      expect(timer?.phaseIndex).toBe(1)
      expect(timer?.status).toBe('running')
      expect(timer?.plannedSeconds).toBe(60)

      expect(mockPostTimerSession).toHaveBeenCalledTimes(1)
      const [focusSession] = mockPostTimerSession.mock.calls[0] as unknown as [
        { presetId: string; completed: boolean },
      ]
      expect(focusSession.presetId).toBe('pomodoro-focus')
      expect(focusSession.completed).toBe(true)

      expect(mockPlayChimeSound).toHaveBeenCalledTimes(1)
      expect(mockNotifyTimerComplete).toHaveBeenCalledTimes(1)
    })

    it('finishes the Pomodoro once the break phase runs out too, logging a break session and notifying again', () => {
      const { result } = renderTimersHook()

      act(() => result.current.openPomodoroDialog())
      act(() => result.current.setPomodoroFocusMinutes(1))
      act(() => result.current.setPomodoroBreakMinutes(1))
      act(() => result.current.confirmPomodoro())
      const id = result.current.timers[0].id

      act(() => result.current.toggleTimer(id))
      act(() => vi.advanceTimersByTime(120_000)) // 60s focus + 60s break

      expect(result.current.timers).toHaveLength(0)
      expect(mockPostTimerSession).toHaveBeenCalledTimes(2)
      const [breakSession] = mockPostTimerSession.mock.calls[1] as unknown as [
        { presetId: string; completed: boolean },
      ]
      expect(breakSession.presetId).toBe('short-break')
      expect(breakSession.completed).toBe(true)

      expect(mockPlayChimeSound).toHaveBeenCalledTimes(2)
      expect(mockNotifyTimerComplete).toHaveBeenCalledTimes(2)
    })

    it('never plays the ambient tick sound for a Pomodoro timer, even with sound enabled', () => {
      mockGetStoredSoundPreference.mockReturnValue(true)
      const { result } = renderTimersHook()

      act(() => result.current.openPomodoroDialog())
      act(() => result.current.confirmPomodoro())
      act(() => result.current.toggleTimer(result.current.timers[0].id))
      act(() => vi.advanceTimersByTime(2500))

      expect(mockPlayTickSound).not.toHaveBeenCalled()
    })

    it('editing an idle Pomodoro only changes its focus phase, leaving break untouched', () => {
      const { result } = renderTimersHook()

      act(() => result.current.openPomodoroDialog())
      act(() => result.current.setPomodoroFocusMinutes(20))
      act(() => result.current.setPomodoroBreakMinutes(10))
      act(() => result.current.confirmPomodoro())
      const id = result.current.timers[0].id

      act(() => result.current.updateTimerMinutes(id, 45))

      const timer = result.current.timers.find((candidate) => candidate.id === id)
      expect(timer?.plannedSeconds).toBe(45 * 60)
      expect(timer?.phases).toEqual([
        { kind: 'focus', seconds: 45 * 60 },
        { kind: 'break', seconds: 10 * 60 },
      ])
    })

    it('a manual stop mid-focus logs only the focus phase, with a pomodoro-focus presetId', () => {
      const { result } = renderTimersHook()

      act(() => result.current.openPomodoroDialog())
      act(() => result.current.setPomodoroFocusMinutes(1))
      act(() => result.current.setPomodoroBreakMinutes(1))
      act(() => result.current.confirmPomodoro())
      const id = result.current.timers[0].id

      act(() => result.current.toggleTimer(id))
      act(() => vi.advanceTimersByTime(10_000))
      act(() => result.current.requestStop(id))
      act(() => result.current.confirmStop())

      expect(result.current.timers).toHaveLength(0)
      expect(mockPostTimerSession).toHaveBeenCalledTimes(1)
      const [session] = mockPostTimerSession.mock.calls[0] as unknown as [
        { presetId: string; completed: boolean },
      ]
      expect(session.presetId).toBe('pomodoro-focus')
      expect(session.completed).toBe(false)
    })
  })

  describe('Task link', () => {
    const sampleTask = {
      id: 1,
      conversationId: null,
      title: 'Clean the kitchen',
      description: null,
      priority: 'medium',
      dueDate: null,
      createdAt: '2026-08-18T10:00:00.000Z',
      subtasks: [],
    }

    it('fetches and exposes linkable Task/Subtask options', async () => {
      mockFetchTasks.mockResolvedValue([sampleTask])
      const { result } = renderTimersHook()

      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.taskLinkOptions).toEqual([
        { key: 'task-1', taskId: 1, subtaskId: null, label: 'Clean the kitchen' },
      ])
    })

    it('attaches the picked link to a created timer, and clears the draft afterward', async () => {
      mockFetchTasks.mockResolvedValue([sampleTask])
      const { result } = renderTimersHook()
      await act(async () => {
        await Promise.resolve()
      })

      act(() => result.current.selectPreset('custom'))
      act(() => result.current.openAddDialog())
      act(() => result.current.setTaskLink(result.current.taskLinkOptions[0]))
      act(() => result.current.addTimer())

      expect(result.current.timers[0].taskLink).toEqual({
        taskId: 1,
        subtaskId: null,
        label: 'Clean the kitchen',
      })
      expect(result.current.taskLink).toBeNull()
    })

    it('posts the link on the logged session for a linked timer', async () => {
      mockFetchTasks.mockResolvedValue([sampleTask])
      const { result } = renderTimersHook()
      await act(async () => {
        await Promise.resolve()
      })

      act(() => result.current.selectPreset('custom'))
      act(() => result.current.openAddDialog())
      act(() => result.current.setTaskLink(result.current.taskLinkOptions[0]))
      act(() => result.current.addTimer())
      const id = result.current.timers[0].id

      act(() => result.current.toggleTimer(id))
      act(() => vi.advanceTimersByTime(10_000))
      act(() => result.current.requestStop(id))
      act(() => result.current.confirmStop())

      expect(mockPostTimerSession).toHaveBeenCalledTimes(1)
      const [session] = mockPostTimerSession.mock.calls[0] as unknown as [
        { taskId: number | null; subtaskId: number | null; taskLabel: string | null },
      ]
      expect(session.taskId).toBe(1)
      expect(session.subtaskId).toBeNull()
      expect(session.taskLabel).toBe('Clean the kitchen')
    })
  })
})
