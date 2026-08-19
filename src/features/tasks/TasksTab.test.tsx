import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/i18n'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { TasksTab } from './TasksTab'
import type { TaskRecord } from './TasksTab.interfaces'

const mockGetToken = vi.fn(async () => 'token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn: true, getToken: mockGetToken }),
}))

const task1: TaskRecord = {
  id: 1,
  conversationId: null,
  title: 'Clean kitchen',
  description: 'A quick tidy-up',
  priority: 'medium',
  dueDate: null,
  createdAt: 'x',
  subtasks: [
    {
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
    },
  ],
}

const mockFetchTasks = vi.fn(async (_getToken: unknown): Promise<TaskRecord[]> => [])
const mockDeleteTaskRequest = vi.fn(
  async (_id: unknown, _getToken: unknown): Promise<boolean> => true,
)
const mockPatchSubtaskRequest = vi.fn(
  async (_id: unknown, patch: Record<string, unknown>, _getToken: unknown) => ({
    ...task1.subtasks[0],
    ...patch,
  }),
)

vi.mock('./useTasksTab.utils', () => ({
  fetchTasks: (getToken: unknown) => mockFetchTasks(getToken),
  deleteTaskRequest: (id: unknown, getToken: unknown) => mockDeleteTaskRequest(id, getToken),
  patchTaskRequest: vi.fn(async () => null),
  createTaskRequest: vi.fn(async () => null),
  createSubtaskRequest: vi.fn(async () => null),
  patchSubtaskRequest: (id: unknown, patch: Record<string, unknown>, getToken: unknown) =>
    mockPatchSubtaskRequest(id, patch, getToken),
  deleteSubtaskRequest: vi.fn(async () => true),
}))

function renderTasksTab() {
  return render(
    <MemoryRouter>
      <ThemeModeProvider>
        <TasksTab />
      </ThemeModeProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  void i18n.changeLanguage('en')
  vi.clearAllMocks()
})

describe('TasksTab', () => {
  it('shows the empty state when there are no tasks', async () => {
    mockFetchTasks.mockResolvedValueOnce([])
    renderTasksTab()

    expect(await screen.findByText(/No tasks yet/)).toBeInTheDocument()
  })

  it('renders a task with its title, description, and subtask', async () => {
    mockFetchTasks.mockResolvedValueOnce([task1])
    renderTasksTab()

    expect(await screen.findByText('Clean kitchen')).toBeInTheDocument()
    expect(screen.getByText('A quick tidy-up')).toBeInTheDocument()
    expect(screen.getByText('Wash dishes')).toBeInTheDocument()
  })

  it('toggles a subtask done via its checkbox', async () => {
    const user = userEvent.setup()
    mockFetchTasks.mockResolvedValueOnce([task1])
    renderTasksTab()

    const checkbox = await screen.findByRole('checkbox', { name: 'Mark as done' })
    await user.click(checkbox)

    await waitFor(() =>
      expect(mockPatchSubtaskRequest).toHaveBeenCalledWith(
        1,
        { completed: true },
        expect.any(Function),
      ),
    )
  })

  it('deletes a task via its delete button', async () => {
    const user = userEvent.setup()
    mockFetchTasks.mockResolvedValueOnce([task1])
    renderTasksTab()

    await screen.findByText('Clean kitchen')
    await user.click(screen.getByRole('button', { name: 'Delete task' }))

    await waitFor(() => expect(screen.queryByText('Clean kitchen')).not.toBeInTheDocument())
  })
})
