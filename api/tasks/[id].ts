import { getUserIdFromRequest } from '../_lib/auth.utils.js'
import { deleteTaskOwned, parseUpdateTaskBody, updateTaskCompleted } from '../_lib/tasks.utils.js'
import type { VercelApiRequest, VercelApiResponse } from '../_lib/vercel-http.interfaces.js'

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const rawId = req.query.id
  const id = Number(Array.isArray(rawId) ? rawId[0] : rawId)
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid task id' })
    return
  }

  if (req.method === 'PATCH') {
    const body = parseUpdateTaskBody(req.body)
    if (!body) {
      res.status(400).json({ error: 'Invalid request' })
      return
    }
    const task = await updateTaskCompleted(userId, id, body.completed)
    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    res.status(200).json({ task })
    return
  }

  if (req.method === 'DELETE') {
    const deleted = await deleteTaskOwned(userId, id)
    if (!deleted) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    res.status(204).send(null)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
