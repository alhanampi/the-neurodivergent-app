export interface ClerkWebhookEmailAddress {
  id: string
  email_address: string
}

export interface ClerkWebhookUserCreatedOrUpdated {
  id: string
  email_addresses: ClerkWebhookEmailAddress[]
  primary_email_address_id: string | null
}

export interface ClerkWebhookUserDeleted {
  id: string
  deleted: true
}

/**
 * Clerk sends many event types we don't act on (session.*, organization.*,
 * etc.) — rather than modeling all of them, keep this loose and cast `data`
 * to the right shape only once `type` has been checked at the call site.
 */
export interface ClerkWebhookEvent {
  type: string
  data: unknown
}
