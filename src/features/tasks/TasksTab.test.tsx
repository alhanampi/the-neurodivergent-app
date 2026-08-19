import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  title: 'Wash dishes',
  estimatedMinutes: 10,
  completed: false,
  createdAt: 'x',
  completedAt: null,
}

const mockFetchTasks = vi.fn(async (_getToken: unknown): Promise<TaskRecord[]> => [])
const mockPatchTaskCompleted = vi.fn(
  async (_id: unknown, completed: boolean, _getToken: unknown): Promise<TaskRecord | null> => ({
    ...task1,
    completed,
  }),
)
const mockDeleteTaskRequest = vi.fn(
  async (_id: unknown, _getToken: unknown): Promise<boolean> => true,
)

vi.mock('./useTasksTab.utils', () => ({
  fetchTasks: (getToken: unknown) => mockFetchTasks(getToken),
  patchTaskCompleted: (id: unknown, completed: boolean, getToken: unknown) =>
    mockPatchTaskCompleted(id, completed, getToken),
  deleteTaskRequest: (id: unknown, getToken: unknown) => mockDeleteTaskRequest(id, getToken),
}))

function renderTasksTab() {
  return render(
    <ThemeModeProvider>
      <TasksTab />
    </ThemeModeProvider>,
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

  it('renders each task with its title and estimated minutes', async () => {
    mockFetchTasks.mockResolvedValueOnce([task1])
    renderTasksTab()

    expect(await screen.findByText('Wash dishes')).toBeInTheDocument()
    expect(screen.getByText('10 min')).toBeInTheDocument()
  })

  it('toggles a task done via its checkbox', async () => {
    const user = userEvent.setup()
    mockFetchTasks.mockResolvedValueOnce([task1])
    renderTasksTab()

    const checkbox = await screen.findByRole('checkbox', { name: 'Mark as done' })
    await user.click(checkbox)

    await waitFor(() =>
      expect(mockPatchTaskCompleted).toHaveBeenCalledWith(1, true, expect.any(Function)),
    )
  })

  it('deletes a task via its delete button', async () => {
    const user = userEvent.setup()
    mockFetchTasks.mockResolvedValueOnce([task1])
    renderTasksTab()

    await screen.findByText('Wash dishes')
    await user.click(screen.getByRole('button', { name: 'Delete task' }))

    await waitFor(() => expect(screen.queryByText('Wash dishes')).not.toBeInTheDocument())
  })
})
