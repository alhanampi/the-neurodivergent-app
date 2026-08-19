import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteTaskRequest, fetchTasks, patchTaskCompleted } from './useTasksTab.utils'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response
}

describe('fetchTasks', () => {
  it('returns [] without calling fetch when there is no token', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchTasks(async () => null)).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the tasks on success', async () => {
    const tasks = [
      {
        id: 1,
        title: 'Wash dishes',
        estimatedMinutes: 10,
        completed: false,
        createdAt: 'x',
        completedAt: null,
      },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ tasks })),
    )

    expect(await fetchTasks(async () => 'token')).toEqual(tasks)
  })

  it('returns [] when the response is not ok or fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(await fetchTasks(async () => 'token')).toEqual([])

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    expect(await fetchTasks(async () => 'token')).toEqual([])
  })
})

describe('patchTaskCompleted', () => {
  it('returns the updated task on success', async () => {
    const task = {
      id: 1,
      title: 'Wash dishes',
      estimatedMinutes: 10,
      completed: true,
      createdAt: 'x',
      completedAt: 'y',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ task })),
    )

    expect(await patchTaskCompleted(1, true, async () => 'token')).toEqual(task)
  })

  it('returns null on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(await patchTaskCompleted(1, true, async () => 'token')).toBeNull()
  })
})

describe('deleteTaskRequest', () => {
  it('returns true on success, false on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(null)),
    )
    expect(await deleteTaskRequest(1, async () => 'token')).toBe(true)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(null, false)),
    )
    expect(await deleteTaskRequest(1, async () => 'token')).toBe(false)
  })
})
