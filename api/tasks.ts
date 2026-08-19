import { getUserIdFromRequest } from './_lib/auth.utils.js'
import {
  conversationBelongsToUser,
  createTaskWithSubtasks,
  listTasksForUser,
  parseCreateTasksBody,
} from './_lib/tasks.utils.js'
import type { VercelApiRequest, VercelApiResponse } from './_lib/vercel-http.interfaces.js'

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    const tasks = await listTasksForUser(userId)
    res.status(200).json({ tasks })
    return
  }

  if (req.method === 'POST') {
    const body = parseCreateTasksBody(req.body)
    if (!body) {
      res.status(400).json({ error: 'Invalid task' })
      return
    }
    if (
      body.conversationId !== null &&
      !(await conversationBelongsToUser(userId, body.conversationId))
    ) {
      res.status(400).json({ error: 'Invalid conversationId' })
      return
    }
    const task = await createTaskWithSubtasks(userId, body)
    res.status(201).json({ task })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
