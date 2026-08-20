import type { VercelApiRequest, VercelApiResponse } from '../_lib/vercel-http.interfaces.js'
import { checkRateLimit, getClientIp } from '../_lib/rate-limit.utils.js'
import {
  deleteUser,
  readRawBody,
  upsertUser,
  verifyClerkWebhook,
} from '../_lib/webhooks/clerk.utils.js'
import type {
  ClerkWebhookUserCreatedOrUpdated,
  ClerkWebhookUserDeleted,
} from '../_lib/webhooks/clerk.interfaces.js'

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

  // Checked before the (more expensive) raw-body read + signature
  // verification — a flood shouldn't get that far. Keyed by source IP since
  // this route has no signed-in user (Clerk is calling us).
  const { limited } = await checkRateLimit('clerkWebhook', getClientIp(req))
  if (limited) {
    res.status(429).json({ error: 'Too many requests' })
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
