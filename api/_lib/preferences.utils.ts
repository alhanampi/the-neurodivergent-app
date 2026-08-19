import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { preferences } from '../../db/schema.js'
import { SUPPORTED_LANGUAGES } from './preferences.interfaces.js'
import type { SupportedLanguage } from './preferences.interfaces.js'

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
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
