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

vi.mock('./useTimersTab.utils', () => ({
  fetchTimerHistory: (getToken: unknown) => mockFetchTimerHistory(getToken),
  postTimerSession: (session: unknown, getToken: unknown) =>
    mockPostTimerSession(session, getToken),
  getNotificationPermission: () => mockGetNotificationPermission(),
  requestNotificationPermission: () => mockRequestNotificationPermission(),
  notifyTimerComplete: (title: unknown, body: unknown) => mockNotifyTimerComplete(title, body),
}))

describe('useTimersTab', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetchTimerHistory.mockClear()
    mockPostTimerSession.mockClear()
    mockNotifyTimerComplete.mockClear()
    mockGetToken.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts idle with the first preset previewed', () => {
    const { result } = renderHook(() => useTimersTab())

    expect(result.current.status).toBe('idle')
    expect(result.current.selectedPresetId).toBe('pomodoro-focus')
    expect(result.current.displaySeconds).toBe(25 * 60)
  })

  it('counts down while running', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.start())
    expect(result.current.status).toBe('running')

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.displaySeconds).toBeLessThan(25 * 60)
  })

  it('freezes the countdown while paused and resumes it', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(3000))
    act(() => result.current.pauseOrResume())
    expect(result.current.status).toBe('paused')
    const frozen = result.current.displaySeconds

    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.displaySeconds).toBe(frozen)

    act(() => result.current.pauseOrResume())
    expect(result.current.status).toBe('running')
  })

  it('ignores preset/minutes/label changes while a timer is active', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.start())
    act(() => result.current.selectPreset('short-break'))

    expect(result.current.selectedPresetId).toBe('pomodoro-focus')
  })

  it('logs a manual stop as incomplete once past the loggable minimum', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(10_000))
    act(() => result.current.stop())

    expect(result.current.status).toBe('idle')
    // postTimerSession is invoked synchronously inside finishSession — only
    // its *resolution* (irrelevant here) is async, so no need to await it.
    expect(mockPostTimerSession).toHaveBeenCalledTimes(1)

    const [session] = mockPostTimerSession.mock.calls[0] as unknown as [
      { completed: boolean; actualSeconds: number },
    ]
    expect(session.completed).toBe(false)
    expect(session.actualSeconds).toBeGreaterThanOrEqual(9)
    expect(mockNotifyTimerComplete).not.toHaveBeenCalled()
  })

  it('does not log a stop below the minimum loggable duration', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(1000))
    act(() => result.current.stop())

    expect(mockPostTimerSession).not.toHaveBeenCalled()
  })

  it('logs completed:true and notifies once the timer runs out naturally', () => {
    const { result } = renderHook(() => useTimersTab())

    act(() => result.current.selectPreset('custom'))
    act(() => result.current.setCustomMinutes(1))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(60_000))

    expect(result.current.status).toBe('idle')
    expect(mockPostTimerSession).toHaveBeenCalledTimes(1)

    const [session] = mockPostTimerSession.mock.calls[0] as unknown as [{ completed: boolean }]
    expect(session.completed).toBe(true)
    expect(mockNotifyTimerComplete).toHaveBeenCalledTimes(1)
  })

  it('requests notification permission on demand', async () => {
    const { result } = renderHook(() => useTimersTab())

    await act(async () => {
      result.current.requestNotifications()
      // Flush the microtask queue so requestNotificationPermission's
      // resolved promise reaches its .then(setNotificationPermission).
      await Promise.resolve()
    })

    expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1)
    expect(result.current.notificationPermission).toBe('granted')
  })
})
