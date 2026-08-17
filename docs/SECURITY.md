# Security checklist

Applied at every iteration, not just the dedicated hardening iteration
(`iteration/09-security-hardening`, v0.10.0).

## Secrets

- No API key, token, or credential ever ships in client-side code or an env var
  prefixed for the client bundle (e.g. no secret in a `VITE_*` variable).
- Groq, Google Calendar, Spotify/SoundCloud, and any other third-party API with a
  secret are called only from `/api` Serverless Functions.
- Secrets are configured as Vercel environment variables, never committed. `.env*`
  files are gitignored.

## Dependencies

- Third-party npm packages are welcome — this project is not dependency-averse —
  but before adding one, check it's actively maintained and has no known unpatched
  CVEs.
- Run `npm audit` before merging any iteration; a flagged high/critical CVE blocks
  the merge until resolved or the package is replaced.
- Dependabot (or equivalent) is configured starting in the security-hardening
  iteration to keep this ongoing rather than one-off.

## `/api` routes

- Every route that touches user data checks the Clerk session server-side before
  doing anything — never trust a client-supplied user id.
- Rate limiting is added in the security-hardening iteration for any route that
  calls a paid/rate-limited third party (Groq) or handles auth webhooks.
- Webhook routes (e.g. Clerk) verify the signature before acting on the payload.

## Data

- Neon is only ever reached from `/api`, never directly from the browser.
- User data (tasks, timer history, preferences) is scoped to the authenticated
  user id on every query — no query without a user-id filter.

## OAuth integrations (Google Calendar, Spotify/SoundCloud)

- Tokens are stored server-side (Neon), never in `localStorage` or client state.
- Scopes requested are the minimum needed for the feature (e.g. calendar
  read/write for the specific calendar, not broader Google account access).
- Users can revoke a connected integration from Settings, which deletes the stored
  token.

## Headers

- CSP and standard security headers (`X-Content-Type-Options`,
  `Referrer-Policy`, etc.) are added as part of the security-hardening iteration
  and reviewed whenever a new external domain (API, CDN, embed) is introduced.

## Accessibility as part of security/trust

- Not a traditional "security" item, but bundled into the same hardening pass:
  WCAG-level accessibility and reduced-motion support, since this app is explicitly
  built for neurodivergent users and a hostile or overwhelming UI is itself a harm
  this project exists to avoid.
