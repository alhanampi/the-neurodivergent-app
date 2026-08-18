import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchTimerHistoryInRange } from './useDashboardTab.utils'

const startDate = new Date('2026-08-01T00:00:00.000Z')
const endDate = new Date('2026-08-18T23:59:59.999Z')

describe('fetchTimerHistoryInRange', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns [] without calling fetch when there is no token', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({}) as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchTimerHistoryInRange(startDate, endDate, async () => null)

    expect(result).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the range as query params and an auth header', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        ({
          ok: true,
          json: async () => ({ sessions: [{ id: 1 }] }),
        }) as unknown as Response,
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchTimerHistoryInRange(startDate, endDate, async () => 'token-123')

    expect(result).toEqual([{ id: 1 }])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      `/api/timer-sessions?startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(endDate.toISOString())}`,
    )
    expect(init?.headers).toEqual({ Authorization: 'Bearer token-123' })
  })

  it('returns [] when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: false }) as unknown as Response),
    )

    const result = await fetchTimerHistoryInRange(startDate, endDate, async () => 'token')

    expect(result).toEqual([])
  })

  it('returns [] when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, _init?: RequestInit): Promise<Response> => {
        throw new Error('network down')
      }),
    )

    const result = await fetchTimerHistoryInRange(startDate, endDate, async () => 'token')

    expect(result).toEqual([])
  })
})
