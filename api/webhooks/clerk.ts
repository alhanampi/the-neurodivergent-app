import type { VercelApiRequest, VercelApiResponse } from '../vercel-http.interfaces'
import { deleteUser, readRawBody, upsertUser, verifyClerkWebhook } from './clerk.utils'
import type { ClerkWebhookUserCreatedOrUpdated, ClerkWebhookUserDeleted } from './clerk.interfaces'

// Raw body required for svix signature verification — see readRawBody.
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    res.status(500).json({ error: 'Webhook not configured' })
    return
  }

  const rawBody = await readRawBody(req)

  const event = (() => {
    try {
      return verifyClerkWebhook(rawBody, req.headers, secret)
    } catch {
      return null
    }
  })()

  if (!event) {
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  if (event.type === 'user.created' || event.type === 'user.updated') {
    await upsertUser(event.data as ClerkWebhookUserCreatedOrUpdated)
  } else if (event.type === 'user.deleted') {
    await deleteUser((event.data as ClerkWebhookUserDeleted).id)
  }

  res.status(200).json({ received: true })
}
