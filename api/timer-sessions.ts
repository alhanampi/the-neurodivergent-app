import type { VercelApiRequest, VercelApiResponse } from './_lib/vercel-http.interfaces.js'
import { getUserIdFromRequest } from './_lib/auth.utils.js'
import {
  createTimerSession,
  listTimerSessions,
  parseCreateTimerSessionBody,
  parseDateRangeQuery,
  verifyTaskLinkOwnership,
} from './_lib/timer-sessions.utils.js'

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    const range = parseDateRangeQuery(req.query)
    if (range === null) {
      res.status(400).json({ error: 'Invalid date range' })
      return
    }

    const sessions = await listTimerSessions(userId, range)
    res.status(200).json({ sessions })
    return
  }

  if (req.method === 'POST') {
    const body = parseCreateTimerSessionBody(req.body)
    if (!body) {
      res.status(400).json({ error: 'Invalid timer session' })
      return
    }
    if (!(await verifyTaskLinkOwnership(userId, body.taskId ?? null, body.subtaskId ?? null))) {
      res.status(400).json({ error: 'Invalid task link' })
      return
    }

    const session = await createTimerSession(userId, body)
    res.status(201).json({ session })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
