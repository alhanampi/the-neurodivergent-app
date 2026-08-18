import { isSupportedLanguage } from './i18n.utils'
import type { SupportedLanguage } from './i18n.interfaces'

type GetToken = () => Promise<string | null>

// Both functions swallow failures on purpose: no /api backend is reachable
// under plain `npm run dev` (Vite doesn't serve /api — use `vercel dev` for
// that), and even in production this is a nice-to-have sync, not something
// that should ever crash the UI. localStorage stays the fallback either way.

export async function fetchAccountLanguage(getToken: GetToken): Promise<SupportedLanguage | null> {
  try {
    const token = await getToken()
    if (!token) return null

    const response = await fetch('/api/preferences', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null

    const body = (await response.json()) as { language?: unknown }
    return isSupportedLanguage(body.language) ? body.language : null
  } catch {
    return null
  }
}

export async function persistAccountLanguage(
  language: SupportedLanguage,
  getToken: GetToken,
): Promise<void> {
  try {
    const token = await getToken()
    if (!token) return

    await fetch('/api/preferences', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language }),
    })
  } catch {
    // Best-effort — localStorage already has the new value.
  }
}
