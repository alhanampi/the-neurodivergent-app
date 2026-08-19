import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useTasksTab } from './useTasksTab'
import type { SubtaskRecord, TaskRecord } from './TasksTab.interfaces'

const mockGetToken = vi.fn(async () => 'token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn: true, getToken: mockGetToken }),
}))

function makeSubtask(overrides: Partial<SubtaskRecord> = {}): SubtaskRecord {
  return {
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
    ...overrides,
  }
}

const task1: TaskRecord = {
  id: 1,
  conversationId: null,
  title: 'Clean kitchen',
  description: 'A quick tidy-up',
  priority: 'medium',
  dueDate: null,
  createdAt: 'x',
  subtasks: [makeSubtask()],
}
const task2: TaskRecord = {
  id: 2,
  conversationId: null,
  title: 'Reply to email',
  description: null,
  priority: 'low',
  dueDate: null,
  createdAt: 'y',
  subtasks: [],
}

const mockFetchTasks = vi.fn(async (_getToken: unknown): Promise<TaskRecord[]> => [task1, task2])
const mockDeleteTaskRequest = vi.fn(async (_id: unknown, _getToken: unknown) => true)
const mockPatchSubtaskRequest = vi.fn(
  async (
    id: number,
    patch: Record<string, unknown>,
    _getToken: unknown,
  ): Promise<SubtaskRecord | null> => ({
    ...makeSubtask({ id }),
    ...patch,
  }),
)
const mockCreateTaskRequest = vi.fn(async (_input: unknown, _getToken: unknown) => task2)

vi.mock('./useTasksTab.utils', () => ({
  fetchTasks: (getToken: unknown) => mockFetchTasks(getToken),
  deleteTaskRequest: (id: unknown, getToken: unknown) => mockDeleteTaskRequest(id, getToken),
  patchTaskRequest: vi.fn(async () => null),
  createTaskRequest: (input: unknown, getToken: unknown) => mockCreateTaskRequest(input, getToken),
  createSubtaskRequest: vi.fn(async () => null),
  patchSubtaskRequest: (id: number, patch: Record<string, unknown>, getToken: unknown) =>
    mockPatchSubtaskRequest(id, patch, getToken),
  deleteSubtaskRequest: vi.fn(async () => true),
}))

function renderTasksHook() {
  return renderHook(() => useTasksTab(), { wrapper: MemoryRouter })
}

describe('useTasksTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchTasks.mockResolvedValue([task1, task2])
    mockDeleteTaskRequest.mockResolvedValue(true)
    mockCreateTaskRequest.mockResolvedValue(task2)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetches tasks (with nested subtasks) on mount', async () => {
    const { result } = renderTasksHook()

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    expect(result.current.tasks).toEqual([task1, task2])
  })

  it('optimistically toggles a subtask completed, then reconciles with the server response', async () => {
    mockPatchSubtaskRequest.mockResolvedValueOnce(
      makeSubtask({ completed: true, completedAt: 'now' }),
    )
    const { result } = renderTasksHook()
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.toggleSubtaskCompleted(1))

    expect(result.current.tasks[0].subtasks[0].completed).toBe(true)
    await waitFor(() =>
      expect(mockPatchSubtaskRequest).toHaveBeenCalledWith(
        1,
        { completed: true },
        expect.any(Function),
      ),
    )
  })

  it('rolls back a subtask toggle if the request fails', async () => {
    mockPatchSubtaskRequest.mockResolvedValueOnce(null)
    const { result } = renderTasksHook()
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.toggleSubtaskCompleted(1))
    expect(result.current.tasks[0].subtasks[0].completed).toBe(true)

    await waitFor(() => expect(result.current.tasks[0].subtasks[0].completed).toBe(false))
  })

  it('optimistically removes a task, and rolls back if deletion fails', async () => {
    mockDeleteTaskRequest.mockResolvedValue(false)
    const { result } = renderTasksHook()
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.deleteTask(1))
    expect(result.current.tasks.map((t) => t.id)).toEqual([2])

    await waitFor(() => expect(result.current.tasks.map((t) => t.id).sort()).toEqual([1, 2]))
  })

  it('starts a subtask timer when its row is expanded for the first time', async () => {
    const { result } = renderTasksHook()
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.toggleSubtaskExpanded(1))

    expect(result.current.expandedSubtaskId).toBe(1)
    await waitFor(() =>
      expect(mockPatchSubtaskRequest).toHaveBeenCalledWith(
        1,
        { timerAction: 'start', minutesDelta: undefined },
        expect.any(Function),
      ),
    )
  })

  it('creates a task via the add-task dialog flow', async () => {
    const { result } = renderTasksHook()
    await waitFor(() => expect(result.current.hasLoadedOnce).toBe(true))

    act(() => result.current.openAddTaskDialog())
    expect(result.current.isAddTaskDialogOpen).toBe(true)

    await act(async () => {
      await result.current.confirmAddTask({ title: 'New task', steps: [] })
    })

    expect(result.current.isAddTaskDialogOpen).toBe(false)
    expect(result.current.tasks[0]).toEqual(task2)
  })
})
