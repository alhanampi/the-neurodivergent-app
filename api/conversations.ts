import { getUserIdFromRequest } from './_lib/auth.utils.js'
import { listConversationsForUser } from './_lib/conversations.utils.js'
import type { VercelApiRequest, VercelApiResponse } from './_lib/vercel-http.interfaces.js'

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const conversations = await listConversationsForUser(userId)
  res.status(200).json({ conversations })
}
