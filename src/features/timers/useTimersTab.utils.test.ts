import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchTimerHistory,
  getNotificationPermission,
  notifyTimerComplete,
  postTimerSession,
  requestNotificationPermission,
} from './useTimersTab.utils'
import type { CreateTimerSession } from './TimersTab.interfaces'

const sampleSession: CreateTimerSession = {
  presetId: 'pomodoro-focus',
  label: null,
  plannedSeconds: 1500,
  actualSeconds: 1500,
  completed: true,
  startedAt: '2026-08-18T10:00:00.000Z',
  endedAt: '2026-08-18T10:25:00.000Z',
}

describe('fetchTimerHistory', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the sessions array on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sessions: [{ id: 1 }] }), { status: 200 })),
    )
    const result = await fetchTimerHistory(async () => 'token')
    expect(result).toEqual([{ id: 1 }])
  })

  it('returns an empty array without a token', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const result = await fetchTimerHistory(async () => null)
    expect(result).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('swallows a failed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 })),
    )
    const result = await fetchTimerHistory(async () => 'token')
    expect(result).toEqual([])
  })

  it('swallows a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    const result = await fetchTimerHistory(async () => 'token')
    expect(result).toEqual([])
  })
})

describe('postTimerSession', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the saved session on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ session: { id: 7 } }), { status: 201 })),
    )
    const result = await postTimerSession(sampleSession, async () => 'token')
    expect(result).toEqual({ id: 7 })
  })

  it('returns null without a token', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const result = await postTimerSession(sampleSession, async () => null)
    expect(result).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns null on a failed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 400 })),
    )
    const result = await postTimerSession(sampleSession, async () => 'token')
    expect(result).toBeNull()
  })
})

describe('notification permission helpers', () => {
  const originalNotification = globalThis.Notification

  afterEach(() => {
    if (originalNotification) {
      Object.defineProperty(globalThis, 'Notification', {
        value: originalNotification,
        configurable: true,
      })
    } else {
      // @ts-expect-error -- restoring test-only deletion
      delete globalThis.Notification
    }
  })

  it('reports "unsupported" when the Notification API does not exist', async () => {
    // @ts-expect-error -- simulating an environment without Notification
    delete globalThis.Notification
    expect(getNotificationPermission()).toBe('unsupported')
    expect(await requestNotificationPermission()).toBe('unsupported')
  })

  it('reads and requests permission through the Notification API', async () => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission)
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'default', requestPermission },
      configurable: true,
    })

    expect(getNotificationPermission()).toBe('default')
    expect(await requestNotificationPermission()).toBe('granted')
    expect(requestPermission).toHaveBeenCalledTimes(1)
  })
})

describe('notifyTimerComplete', () => {
  const originalNotification = globalThis.Notification

  beforeEach(() => {
    Object.defineProperty(globalThis, 'Notification', {
      value: Object.assign(vi.fn(), { permission: 'granted' as NotificationPermission }),
      configurable: true,
    })
  })

  afterEach(() => {
    if (originalNotification) {
      Object.defineProperty(globalThis, 'Notification', {
        value: originalNotification,
        configurable: true,
      })
    } else {
      // @ts-expect-error -- restoring test-only deletion
      delete globalThis.Notification
    }
    vi.unstubAllGlobals()
  })

  it('does nothing without permission', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: Object.assign(vi.fn(), { permission: 'denied' as NotificationPermission }),
      configurable: true,
    })
    await notifyTimerComplete('title', 'body')
    expect(globalThis.Notification).not.toHaveBeenCalled()
  })

  it('prefers the active service worker registration when available', async () => {
    const showNotification = vi.fn()
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: async () => ({ showNotification }) },
    })

    await notifyTimerComplete('title', 'body')

    expect(showNotification).toHaveBeenCalledWith(
      'title',
      expect.objectContaining({ body: 'body' }),
    )
  })

  it('falls back to the Notification constructor with no registration', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => undefined } })

    await notifyTimerComplete('title', 'body')

    expect(globalThis.Notification).toHaveBeenCalledWith(
      'title',
      expect.objectContaining({ body: 'body' }),
    )
  })
})
