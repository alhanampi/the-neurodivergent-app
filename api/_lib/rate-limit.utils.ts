import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { VercelApiRequest } from './vercel-http.interfaces.js'

/**
 * Fresh client/limiter per call, not a module-level singleton — mirrors
 * groq.client.ts's own reasoning: serverless functions are short-lived and
 * stateless between invocations, so there's no real reuse benefit. Returns
 * null when UPSTASH_REDIS_REST_URL/_TOKEN aren't configured (no Upstash
 * account set up yet, or a misconfigured deploy) so callers can choose to
 * fail open — see checkRateLimit's own doc for why that's the right default.
 */
function createLimiter(requests: number, windowSeconds: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
  })
}

// Per-route limits, tuned to what each one actually protects against:
// - chat / chatPlan call Groq, a paid/rate-limited third party — capped per
//   signed-in user so one account can't run up spend or exhaust Groq's own
//   rate limit for everyone else.
// - clerkWebhook has no signed-in user (Clerk calling us, not the other way
//   around) — capped per source IP instead, as a flood guard on a route that
//   does real DB writes on every call.
const LIMITERS = {
  chat: () => createLimiter(20, 60), // 20 messages / min / user
  chatPlan: () => createLimiter(10, 60), // 10 plan conversions / min / user
  clerkWebhook: () => createLimiter(60, 60), // 60 events / min / IP
} as const

export type RateLimitKind = keyof typeof LIMITERS

/**
 * Checks and consumes one request against the given limiter for the given
 * identifier (a Clerk user id for authenticated routes, an IP for the
 * webhook). Fails OPEN — returns `{ limited: false }` — when Upstash isn't
 * configured or the Upstash call itself errors. A rate limiter that's
 * unreachable should never be the reason a real, authenticated user can't
 * use the app; see docs/SECURITY.md for this tradeoff and its current status.
 */
export async function checkRateLimit(
  kind: RateLimitKind,
  identifier: string,
): Promise<{ limited: boolean }> {
  const limiter = LIMITERS[kind]()
  if (!limiter) return { limited: false }

  try {
    const { success } = await limiter.limit(`${kind}:${identifier}`)
    return { limited: !success }
  } catch (error) {
    console.error(`Rate limit check failed (${kind}):`, error)
    return { limited: false }
  }
}

/**
 * Best-effort client IP from Vercel's `x-forwarded-for`, for the one route
 * with no authenticated user id to key on (the Clerk webhook). Per Vercel's
 * own docs, the header is `client, proxy1, proxy2, ...` — the first entry is
 * the original client as seen by Vercel's edge. Not spoof-proof on its own
 * (a client can send its own `x-forwarded-for`), but that only lets someone
 * dodge their own rate-limit bucket, not anyone else's — good enough for a
 * soft rate-limit key, not something an authorization decision should ever
 * rest on.
 */
export function getClientIp(req: VercelApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const clientIp = raw?.split(',')[0]?.trim()
  return clientIp || 'unknown'
}
