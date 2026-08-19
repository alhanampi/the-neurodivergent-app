import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTasksTab } from './useTasksTab'
import type { TaskRecord } from './TasksTab.interfaces'

const mockGetToken = vi.fn(async () => 'token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn: true, getToken: mockGetToken }),
}))

const task1: TaskRecord = {
  id: 1,
  title: 'Wash dishes',
  estimatedMinutes: 10,
  completed: false,
  createdAt: 'x',
  completedAt: null,
}
const task2: TaskRecord = {
  id: 2,
  title: 'Wipe counters',
  estimatedMinutes: 5,
  completed: false,
  createdAt: 'y',
  completedAt: null,
}

const mockFetchTasks = vi.fn(async (_getToken: unknown): Promise<TaskRecord[]> => [task1, task2])
const mockPatchTaskCompleted = vi.fn(
  async (_id: unknown, completed: boolean, _getToken: unknown): Promise<TaskRecord | null> => ({
    ...task1,
    completed,
    completedAt: completed ? 'now' : null,
  }),
)
const mockDeleteTaskRequest = vi.fn(async (_id: unknown, _getToken: unknown) => true)

vi.mock('./useTasksTab.utils', () => ({
  fetchTasks: (getToken: unknown) => mockFetchTasks(getToken),
  patchTaskCompleted: (id: unknown, completed: boolean, getToken: unknown) =>
    mockPatchTaskCompleted(id, completed, getToken),
  deleteTaskRequest: (id: unknown, getToken: unknown) => mockDeleteTaskRequest(id, getToken),
}))

describe('useTasksTab', () => {
  beforeEach(() => {
    mockFetchTasks.mockClear()
    mockPatchTaskCompleted.mockClear()
    mockDeleteTaskRequest.mockClear()
    mockFetchTasks.mockResolvedValue([task1, task2])
    mockPatchTaskCompleted.mockResolvedValue({ ...task1, completed: true, completedAt: 'now' })
    mockDeleteTaskRequest.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetches tasks on mount', async () => {
    const { result } = renderHook(() => useTasksTab())

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    expect(result.current.tasks).toEqual([task1, task2])
    expect(result.current.isLoading).toBe(false)
  })

  it('optimistically toggles a task, then reconciles with the server response', async () => {
    const { result } = renderHook(() => useTasksTab())
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.toggleTask(1))

    // Optimistic flip is immediate, synchronous with the click.
    expect(result.current.tasks.find((t) => t.id === 1)?.completed).toBe(true)

    await waitFor(() =>
      expect(mockPatchTaskCompleted).toHaveBeenCalledWith(1, true, expect.any(Function)),
    )
    await waitFor(() =>
      expect(result.current.tasks.find((t) => t.id === 1)?.completedAt).toBe('now'),
    )
  })

  it('rolls back the toggle if the request fails', async () => {
    mockPatchTaskCompleted.mockResolvedValue(null)
    const { result } = renderHook(() => useTasksTab())
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.toggleTask(1))
    expect(result.current.tasks.find((t) => t.id === 1)?.completed).toBe(true)

    await waitFor(() => expect(result.current.tasks.find((t) => t.id === 1)?.completed).toBe(false))
  })

  it('optimistically removes a task, and rolls back if deletion fails', async () => {
    mockDeleteTaskRequest.mockResolvedValue(false)
    const { result } = renderHook(() => useTasksTab())
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.deleteTask(1))
    expect(result.current.tasks.map((t) => t.id)).toEqual([2])

    await waitFor(() => expect(result.current.tasks.map((t) => t.id).sort()).toEqual([1, 2]))
  })

  it('removes a task for good when deletion succeeds', async () => {
    const { result } = renderHook(() => useTasksTab())
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.deleteTask(1))
    await waitFor(() => expect(mockDeleteTaskRequest).toHaveBeenCalled())

    expect(result.current.tasks.map((t) => t.id)).toEqual([2])
  })
})
