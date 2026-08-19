import type { TaskRecord } from './TasksTab.interfaces'

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

export async function patchTaskCompleted(
  taskId: number,
  completed: boolean,
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
      body: JSON.stringify({ completed }),
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
