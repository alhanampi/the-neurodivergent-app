import { getUserIdFromRequest } from './_lib/auth.utils.js'
import { createSubtaskOwned, parseCreateSubtaskBody } from './_lib/subtasks.utils.js'
import type { VercelApiRequest, VercelApiResponse } from './_lib/vercel-http.interfaces.js'

// Single-item creation, used by the "Add Subtask" popup — batch-creation
// from an approved AI plan goes through POST /api/tasks instead (see
// tasks.interfaces.ts's CreateTasksBody).
export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = parseCreateSubtaskBody(req.body)
  if (!body) {
    res.status(400).json({ error: 'Invalid subtask' })
    return
  }

  const subtask = await createSubtaskOwned(userId, body)
  if (!subtask) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  res.status(201).json({ subtask })
}
