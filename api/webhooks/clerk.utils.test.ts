import { describe, expect, it } from 'vitest'
import { getPrimaryEmail, verifyClerkWebhook } from './clerk.utils'

// Note: upsertUser/deleteUser (the DB-writing side) aren't unit-tested here
// — they're thin passthroughs to Drizzle's own query builder. The logic
// worth covering in isolation is what's below: picking the right email, and
// rejecting bad signatures.

describe('getPrimaryEmail', () => {
  it('returns the address matching primary_email_address_id', () => {
    const user = {
      id: 'user_1',
      primary_email_address_id: 'email_2',
      email_addresses: [
        { id: 'email_1', email_address: 'first@example.com' },
        { id: 'email_2', email_address: 'primary@example.com' },
      ],
    }

    expect(getPrimaryEmail(user)).toBe('primary@example.com')
  })

  it('falls back to the first address when no primary is set', () => {
    const user = {
      id: 'user_1',
      primary_email_address_id: null,
      email_addresses: [{ id: 'email_1', email_address: 'first@example.com' }],
    }

    expect(getPrimaryEmail(user)).toBe('first@example.com')
  })

  it('returns null when there are no email addresses at all', () => {
    const user = { id: 'user_1', primary_email_address_id: null, email_addresses: [] }

    expect(getPrimaryEmail(user)).toBeNull()
  })
})

describe('verifyClerkWebhook', () => {
  it('throws for a signature that does not match the payload', () => {
    // Deliberately no "whsec_" prefix: svix only strips it if present (it's
    // optional — see standardwebhooks' Webhook constructor) and falls back to
    // decoding the whole string as base64 either way, so this is just as
    // valid a fixture — but a bare "whsec_..." string is exactly what trips
    // GitHub's secret scanner (that prefix is also Stripe's webhook-secret
    // format), even though this was always a fake, hardcoded, never-valid
    // value. This base64 happens to decode to "not-a-real-secret-fake-test-value".
    const fakeSigningKey = 'bm90LWEtcmVhbC1zZWNyZXQtZmFrZS10ZXN0LXZhbHVl'

    expect(() =>
      verifyClerkWebhook(
        '{"type":"user.created"}',
        {
          'svix-id': 'msg_1',
          'svix-timestamp': String(Math.floor(Date.now() / 1000)),
          'svix-signature': 'v1,not-a-real-signature',
        },
        fakeSigningKey,
      ),
    ).toThrow()
  })
})
