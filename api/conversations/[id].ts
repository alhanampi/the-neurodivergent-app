import { getUserIdFromRequest } from '../_lib/auth.utils.js'
import {
  deleteConversationOwned,
  getOwnedConversation,
  listMessagesForConversation,
  parseRenameBody,
  renameConversation,
} from '../_lib/conversations.utils.js'
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
    res.status(400).json({ error: 'Invalid conversation id' })
    return
  }

  // Ownership is checked once, before branching on method — a conversation
  // id belonging to another user always 404s, never reveals it exists
  // (IDOR prevention).
  const owned = await getOwnedConversation(userId, id)
  if (!owned) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  if (req.method === 'GET') {
    const messages = await listMessagesForConversation(id)
    res.status(200).json({ messages })
    return
  }

  if (req.method === 'PUT') {
    const body = parseRenameBody(req.body)
    if (!body) {
      res.status(400).json({ error: 'Invalid title' })
      return
    }
    const conversation = await renameConversation(userId, id, body.title)
    res.status(200).json({ conversation })
    return
  }

  if (req.method === 'DELETE') {
    await deleteConversationOwned(userId, id)
    res.status(204).send(null)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
