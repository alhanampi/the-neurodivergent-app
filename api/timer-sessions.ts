import type { VercelApiRequest, VercelApiResponse } from './vercel-http.interfaces'
import { getUserIdFromRequest } from './auth.utils'
import {
  createTimerSession,
  listTimerSessions,
  parseCreateTimerSessionBody,
} from './timer-sessions.utils'

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    const sessions = await listTimerSessions(userId)
    res.status(200).json({ sessions })
    return
  }

  if (req.method === 'POST') {
    const body = parseCreateTimerSessionBody(req.body)
    if (!body) {
      res.status(400).json({ error: 'Invalid timer session' })
      return
    }

    const session = await createTimerSession(userId, body)
    res.status(201).json({ session })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
