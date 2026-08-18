import { verifyToken } from '@clerk/backend'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { preferences } from '../db/schema'
import { SUPPORTED_LANGUAGES } from './preferences.interfaces'
import type { SupportedLanguage } from './preferences.interfaces'
import type { VercelApiRequest } from './vercel-http.interfaces'

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/** Verifies the Clerk session token from the Authorization header and
 * returns the signed-in user's id, or null if it's missing/invalid. */
export async function getUserIdFromRequest(req: VercelApiRequest): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) return null

  try {
    const token = authHeader.slice('Bearer '.length)
    const payload = await verifyToken(token, { secretKey })
    return payload.sub
  } catch {
    return null
  }
}

export async function getLanguagePreference(userId: string): Promise<SupportedLanguage> {
  const [row] = await db
    .select({ language: preferences.language })
    .from(preferences)
    .where(eq(preferences.userId, userId))

  return isSupportedLanguage(row?.language) ? row.language : 'en'
}

export async function setLanguagePreference(
  userId: string,
  language: SupportedLanguage,
): Promise<void> {
  await db
    .insert(preferences)
    .values({ userId, language })
    .onConflictDoUpdate({
      target: preferences.userId,
      set: { language, updatedAt: new Date() },
    })
}
