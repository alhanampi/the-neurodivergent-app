import Groq from 'groq-sdk'

/**
 * A fresh client per request, not a module-level singleton — serverless
 * functions are short-lived and stateless between invocations, so there's
 * no real reuse benefit, and per-request construction is simpler to reason
 * about and test than caching across cold starts. Returns null when
 * GROQ_API_KEY isn't configured (local dev without a key, or a
 * misconfigured deploy) so callers can fail fast with a friendly message
 * instead of Groq's own SDK throwing deep inside a request handler.
 */
export function createGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null
  return new Groq({ apiKey })
}
