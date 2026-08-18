import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no timers, the first preset selected, and the Add dialog closed', () => {
    const { result } = renderHook(() => useTimersTab())

    expect(result.current.timers).toEqual([])
    expect(result.current.selectedPresetId).toBe('pomodoro-focus')
    expect(result.current.isAddDialogOpen).toBe(false)
  })

  it("opening the Add dialog resets the draft duration to the selected preset's suggested default", () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.selectPreset('long-break'))
    act(() => result.current.setDraftMinutes(90))
    act(() => result.current.openAddDialog())

    expect(result.current.isAddDialogOpen).toBe(true)
    expect(result.current.draftMinutes).toBe(15)
  })

  it("the Custom preset's Add dialog still defaults to 10 minutes", () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.selectPreset('custom'))
    act(() => result.current.openAddDialog())

    expect(result.current.draftMinutes).toBe(10)
  })

  it('opening the Add dialog while Focus is selected opens the Pomodoro dialog instead, defaulting to 20/10', () => {
    const { result } = renderHook(() => useTimersTab())

    // 'pomodoro-focus' (Focus) is the default selected preset.
    act(() => result.current.setPomodoroFocusMinutes(90))
    act(() => result.current.setPomodoroBreakMinutes(90))
    act(() => result.current.openAddDialog())

    expect(result.current.isPomodoroDialogOpen).toBe(true)
    expect(result.current.isAddDialogOpen).toBe(false)
    expect(result.current.pomodoroFocusMinutes).toBe(20)
    expect(result.current.pomodoroBreakMinutes).toBe(10)
  })

  it('closing the Add dialog without confirming adds nothing', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.selectPreset('custom'))
    act(() => result.current.openAddDialog())
    expect(result.current.isAddDialogOpen).toBe(true)
    act(() => result.current.closeAddDialog())

    expect(result.current.isAddDialogOpen).toBe(false)
    expect(result.current.timers).toEqual([])
  })

  it('closing the Pomodoro dialog without confirming adds nothing', () => {
    const { result } = renderHook(() => useTimersTab())

    // 'pomodoro-focus' (Focus) is the default selected preset.
    act(() => result.current.openAddDialog())
    expect(result.current.isPomodoroDialogOpen).toBe(true)
    act(() => result.current.closePomodoroDialog())

    expect(result.current.isPomodoroDialogOpen).toBe(false)
    expect(result.current.timers).toEqual([])
  })

  it('adds an idle timer, clears the name draft, and closes the dialog', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.setNameDraft('Fold laundry'))
    act(() => result.current.selectPreset('custom'))
    act(() => result.current.openAddDialog())
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
    const { result } = renderHook(() => useTimersTab())

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
    const { result } = renderHook(() => useTimersTab())

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
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.addTimer())
    const id = result.current.timers[0].id

    act(() => result.current.requestStop(id))

    expect(result.current.timers).toHaveLength(0)
    expect(result.current.pendingStopId).toBeNull()
    expect(mockPostTimerSession).not.toHaveBeenCalled()
  })

  it('asks for confirmation before stopping a running timer, and only removes it on confirm', () => {
    const { result } = renderHook(() => useTimersTab())

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
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.addTimer())
    const id = result.current.timers[0].id
    act(() => result.current.toggleTimer(id))
    act(() => vi.advanceTimersByTime(1000))

    act(() => result.current.requestStop(id))
    act(() => result.current.confirmStop())

    expect(mockPostTimerSession).not.toHaveBeenCalled()
  })

  it('edits an idle timer duration, but leaves a running one alone', () => {
    const { result } = renderHook(() => useTimersTab())

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

  it('auto-completes, logs completed:true, and notifies once a timer runs out', () => {
    const { result } = renderHook(() => useTimersTab())

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
    const { result } = renderHook(() => useTimersTab())

    expect(result.current.isSoundEnabled).toBe(true)

    act(() => result.current.addTimer())
    act(() => result.current.toggleTimer(result.current.timers[0].id))
    act(() => vi.advanceTimersByTime(2500))

    expect(mockPlayTickSound).toHaveBeenCalled()
  })

  it('does not play a tick sound when sound is disabled', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.addTimer())
    act(() => result.current.toggleTimer(result.current.timers[0].id))
    act(() => vi.advanceTimersByTime(2500))

    expect(mockPlayTickSound).not.toHaveBeenCalled()
  })

  it('toggleSound flips state, persists it, and unlocks audio when turning on', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.toggleSound())

    expect(result.current.isSoundEnabled).toBe(true)
    expect(mockSetStoredSoundPreference).toHaveBeenCalledWith(true)
    expect(mockUnlockAudio).toHaveBeenCalled()
  })

  it('requests notification permission on demand', async () => {
    const { result } = renderHook(() => useTimersTab())

    await act(async () => {
      result.current.requestNotifications()
      await Promise.resolve()
    })

    expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1)
    expect(result.current.notificationPermission).toBe('granted')
  })

  describe('Pomodoro timers', () => {
    it('confirmPomodoro creates a two-phase timer, clears the name draft, and closes the dialog', () => {
      const { result } = renderHook(() => useTimersTab())

      act(() => result.current.setNameDraft('Deep work'))
      // 'pomodoro-focus' (Focus) is the default selected preset.
      act(() => result.current.openAddDialog())
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
      const { result } = renderHook(() => useTimersTab())

      act(() => result.current.openAddDialog())
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
      const { result } = renderHook(() => useTimersTab())

      act(() => result.current.openAddDialog())
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
      const { result } = renderHook(() => useTimersTab())

      act(() => result.current.openAddDialog())
      act(() => result.current.confirmPomodoro())
      act(() => result.current.toggleTimer(result.current.timers[0].id))
      act(() => vi.advanceTimersByTime(2500))

      expect(mockPlayTickSound).not.toHaveBeenCalled()
    })

    it('editing an idle Pomodoro only changes its focus phase, leaving break untouched', () => {
      const { result } = renderHook(() => useTimersTab())

      act(() => result.current.openAddDialog())
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
      const { result } = renderHook(() => useTimersTab())

      act(() => result.current.openAddDialog())
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
})
