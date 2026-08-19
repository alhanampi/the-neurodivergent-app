import { getUserIdFromRequest } from './_lib/auth.utils.js'
import { createTasks, listTasksForUser, parseCreateTasksBody } from './_lib/tasks.utils.js'
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
      res.status(400).json({ error: 'Invalid tasks' })
      return
    }
    const tasks = await createTasks(userId, body.steps)
    res.status(201).json({ tasks })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
