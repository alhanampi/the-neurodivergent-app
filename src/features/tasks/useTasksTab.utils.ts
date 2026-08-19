import type { SubtaskTimerAction, TaskPriority, TaskRecord } from './TasksTab.interfaces'

type GetToken = () => Promise<string | null>

// Every function here swallows failures into a safe default rather than
// throwing — same convention as useTimersTab.utils.ts: no /api backend is
// reachable under plain `npm run dev` (use `vercel dev` for that).

export async function fetchTasks(getToken: GetToken): Promise<TaskRecord[]> {
  try {
    const token = await getToken()
    if (!token) return []

    const response = await fetch('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return []

    const body = (await response.json()) as { tasks?: TaskRecord[] }
    return body.tasks ?? []
  } catch {
    return []
  }
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  priority?: TaskPriority
  dueDate?: string | null
  conversationId?: number | null
  steps?: { title: string; minutes: number }[]
}

export async function createTaskRequest(
  input: CreateTaskInput,
  getToken: GetToken,
): Promise<TaskRecord | null> {
  try {
    const token = await getToken()
    if (!token) return null

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...input, steps: input.steps ?? [] }),
    })
    if (!response.ok) return null

    const body = (await response.json()) as { task?: TaskRecord }
    return body.task ?? null
  } catch {
    return null
  }
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  priority?: TaskPriority
  dueDate?: string | null
}

export async function patchTaskRequest(
  taskId: number,
  input: UpdateTaskInput,
  getToken: GetToken,
): Promise<TaskRecord | null> {
  try {
    const token = await getToken()
    if (!token) return null

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })
    if (!response.ok) return null

    const body = (await response.json()) as { task?: TaskRecord }
    return body.task ?? null
  } catch {
    return null
  }
}

export async function deleteTaskRequest(taskId: number, getToken: GetToken): Promise<boolean> {
  try {
    const token = await getToken()
    if (!token) return false

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.ok
  } catch {
    return false
  }
}

export interface CreateSubtaskInput {
  taskId: number
  title: string
  minutes: number
  priority?: TaskPriority
  dueDate?: string | null
}

export async function createSubtaskRequest(
  input: CreateSubtaskInput,
  getToken: GetToken,
): Promise<TaskRecord['subtasks'][number] | null> {
  try {
    const token = await getToken()
    if (!token) return null

    const response = await fetch('/api/subtasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })
    if (!response.ok) return null

    const body = (await response.json()) as { subtask?: TaskRecord['subtasks'][number] }
    return body.subtask ?? null
  } catch {
    return null
  }
}

export interface UpdateSubtaskInput {
  title?: string
  estimatedMinutes?: number
  priority?: TaskPriority
  dueDate?: string | null
  completed?: boolean
  timerAction?: SubtaskTimerAction
  minutesDelta?: number
}

export async function patchSubtaskRequest(
  subtaskId: number,
  input: UpdateSubtaskInput,
  getToken: GetToken,
): Promise<TaskRecord['subtasks'][number] | null> {
  try {
    const token = await getToken()
    if (!token) return null

    const response = await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })
    if (!response.ok) return null

    const body = (await response.json()) as { subtask?: TaskRecord['subtasks'][number] }
    return body.subtask ?? null
  } catch {
    return null
  }
}

export async function deleteSubtaskRequest(
  subtaskId: number,
  getToken: GetToken,
): Promise<boolean> {
  try {
    const token = await getToken()
    if (!token) return false

    const response = await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.ok
  } catch {
    return false
  }
}
