import type { VercelApiRequest, VercelApiResponse } from './vercel-http.interfaces.js'
import { getUserIdFromRequest } from './auth.utils.js'
import {
  getLanguagePreference,
  isSupportedLanguage,
  setLanguagePreference,
} from './preferences.utils.js'

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    const language = await getLanguagePreference(userId)
    res.status(200).json({ language })
    return
  }

  if (req.method === 'PUT') {
    const body = req.body as { language?: unknown }
    if (!isSupportedLanguage(body.language)) {
      res.status(400).json({ error: 'Invalid language' })
      return
    }

    await setLanguagePreference(userId, body.language)
    res.status(200).json({ language: body.language })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
