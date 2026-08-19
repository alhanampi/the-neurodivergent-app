import { verifyToken } from '@clerk/backend'
import type { VercelApiRequest } from './vercel-http.interfaces.js'

/** Verifies the Clerk session token from the Authorization header and
 * returns the signed-in user's id, or null if it's missing/invalid. Shared
 * by every authenticated /api route — see preferences.utils.ts and
 * timer-sessions.utils.ts for usage. */
export async function getUserIdFromRequest(req: VercelApiRequest): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) return null

  try {
    const token = authHeader.slice('Bearer '.length)
    const payload = await verifyToken(token, { secretKey })
    return payload.sub
  } catch (error) {
    console.error('Clerk verifyToken failed:', error)
    return null
  }
}
