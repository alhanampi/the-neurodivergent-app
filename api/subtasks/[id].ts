import { getUserIdFromRequest } from '../_lib/auth.utils.js'
import {
  deleteSubtaskOwned,
  parseUpdateSubtaskBody,
  updateSubtaskOwned,
} from '../_lib/subtasks.utils.js'
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
    res.status(400).json({ error: 'Invalid subtask id' })
    return
  }

  if (req.method === 'PATCH') {
    const body = parseUpdateSubtaskBody(req.body)
    if (!body) {
      res.status(400).json({ error: 'Invalid request' })
      return
    }
    const subtask = await updateSubtaskOwned(userId, id, body)
    if (!subtask) {
      res.status(404).json({ error: 'Subtask not found' })
      return
    }
    res.status(200).json({ subtask })
    return
  }

  if (req.method === 'DELETE') {
    const deleted = await deleteSubtaskOwned(userId, id)
    if (!deleted) {
      res.status(404).json({ error: 'Subtask not found' })
      return
    }
    res.status(204).send(null)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
