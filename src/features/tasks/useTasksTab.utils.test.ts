import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createSubtaskRequest,
  createTaskRequest,
  deleteSubtaskRequest,
  deleteTaskRequest,
  fetchTasks,
  patchSubtaskRequest,
  patchTaskRequest,
} from './useTasksTab.utils'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response
}

const task = {
  id: 1,
  conversationId: null,
  title: 'Clean kitchen',
  description: null,
  priority: 'medium',
  dueDate: null,
  createdAt: 'x',
  subtasks: [],
}

const subtask = {
  id: 1,
  taskId: 1,
  title: 'Wash dishes',
  estimatedMinutes: 10,
  priority: 'medium',
  dueDate: null,
  completed: false,
  completedAt: null,
  timerStatus: 'idle',
  remainingSeconds: 600,
  timerEndAt: null,
  sortOrder: 0,
  createdAt: 'x',
}

describe('fetchTasks', () => {
  it('returns [] without calling fetch when there is no token', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchTasks(async () => null)).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the tasks on success, [] on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ tasks: [task] })),
    )
    expect(await fetchTasks(async () => 'token')).toEqual([task])

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(await fetchTasks(async () => 'token')).toEqual([])
  })
})

describe('createTaskRequest', () => {
  it('returns the created task on success, null on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ task })),
    )
    expect(
      await createTaskRequest({ title: 'Clean kitchen', steps: [] }, async () => 'token'),
    ).toEqual(task)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(
      await createTaskRequest({ title: 'Clean kitchen', steps: [] }, async () => 'token'),
    ).toBeNull()
  })
})

describe('patchTaskRequest', () => {
  it('returns the updated task on success, null on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ task })),
    )
    expect(await patchTaskRequest(1, { priority: 'high' }, async () => 'token')).toEqual(task)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(await patchTaskRequest(1, { priority: 'high' }, async () => 'token')).toBeNull()
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

describe('createSubtaskRequest', () => {
  it('returns the created subtask on success, null on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ subtask })),
    )
    expect(
      await createSubtaskRequest(
        { taskId: 1, title: 'Wash dishes', minutes: 10 },
        async () => 'token',
      ),
    ).toEqual(subtask)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(
      await createSubtaskRequest(
        { taskId: 1, title: 'Wash dishes', minutes: 10 },
        async () => 'token',
      ),
    ).toBeNull()
  })
})

describe('patchSubtaskRequest', () => {
  it('returns the updated subtask on success, null on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ subtask })),
    )
    expect(await patchSubtaskRequest(1, { timerAction: 'start' }, async () => 'token')).toEqual(
      subtask,
    )

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(await patchSubtaskRequest(1, { timerAction: 'start' }, async () => 'token')).toBeNull()
  })
})

describe('deleteSubtaskRequest', () => {
  it('returns true on success, false on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(null)),
    )
    expect(await deleteSubtaskRequest(1, async () => 'token')).toBe(true)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(null, false)),
    )
    expect(await deleteSubtaskRequest(1, async () => 'token')).toBe(false)
  })
})
