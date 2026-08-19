import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkRateLimit, getClientIp } from './rate-limit.utils.js'
import type { VercelApiRequest } from './vercel-http.interfaces.js'

describe('checkRateLimit', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN

  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL
    else process.env.UPSTASH_REDIS_REST_URL = originalUrl
    if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken
  })

  it('fails open (not limited) when Upstash env vars are missing', async () => {
    const result = await checkRateLimit('chat', 'user_123')
    expect(result).toEqual({ limited: false })
  })
})

describe('getClientIp', () => {
  function requestWithHeader(value: string | string[] | undefined): VercelApiRequest {
    return { headers: { 'x-forwarded-for': value } } as unknown as VercelApiRequest
  }

  it('takes the first entry of a comma-separated x-forwarded-for', () => {
    expect(getClientIp(requestWithHeader('203.0.113.5, 70.41.3.18, 150.172.238.178'))).toBe(
      '203.0.113.5',
    )
  })

  it('trims whitespace around the first entry', () => {
    expect(getClientIp(requestWithHeader(' 203.0.113.5 , 70.41.3.18'))).toBe('203.0.113.5')
  })

  it('handles a single IP with no comma', () => {
    expect(getClientIp(requestWithHeader('203.0.113.5'))).toBe('203.0.113.5')
  })

  it('uses the first value when the header arrives as an array', () => {
    expect(getClientIp(requestWithHeader(['203.0.113.5', '70.41.3.18']))).toBe('203.0.113.5')
  })

  it('falls back to "unknown" when the header is missing', () => {
    expect(getClientIp(requestWithHeader(undefined))).toBe('unknown')
  })
})
