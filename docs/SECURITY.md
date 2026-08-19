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
  the merge until resolved, the package is replaced, or it's explicitly accepted
  and documented here (see below) — silent ignoring isn't acceptable either way.
- Dependabot (or equivalent) is configured starting in the security-hardening
  iteration to keep this ongoing rather than one-off.
- Before adding a package just for its TypeScript types, check whether it's worth
  the transitive dependencies it drags in — e.g. `@vercel/node` pulls in a full
  build-analysis toolchain for what we only needed as type declarations; hand-rolled
  types (`api/vercel-http.interfaces.ts`) avoided ~10 CVEs that added zero real
  functionality for us.

### Accepted risks

- **`esbuild` via `drizzle-kit`'s deprecated `@esbuild-kit/esm-loader` (moderate,
  [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99),
  since v0.5.0):** the advisory is about esbuild's _dev server_ accepting requests
  from any website — we never run esbuild as a server; `drizzle-kit` only uses it
  to transpile `drizzle.config.ts` when we run migration commands locally. No
  non-breaking fix exists yet (the suggested fix downgrades `drizzle-kit` to
  0.18.1, an ~2-year-old release incompatible with our schema/config format).
  Revisit when `drizzle-kit` ships a version off `@esbuild-kit`.
- **No DB transaction around `/api/chat`'s write sequence (since v0.9.0):**
  the user's message is written to Neon before calling Groq, and the
  assistant's reply is written after the stream completes — with no
  transaction wrapping the two, since this project's `neon-http` Drizzle
  driver doesn't support `db.transaction()`. A crash/failure between those
  two writes leaves an orphaned user message with no reply. Low consequence
  (a dangling, clearly-incomplete row scoped to that one user — not
  corrupted or cross-user data, not a security boundary), so accepted rather
  than built around this iteration. Revisit if Neon/Drizzle add HTTP-driver
  transaction support, or if `neon-http` gets swapped for a driver that has it.

## `/api` routes

- Every route that touches user data checks the Clerk session server-side before
  doing anything — never trust a client-supplied user id.
- Rate limiting (v0.10.0, `api/_lib/rate-limit.utils.ts`, Upstash Redis
  sliding-window) covers `/api/chat` and `/api/chat-plan` (20/min and
  10/min respectively, keyed per signed-in user — protects Groq spend and
  Groq's own rate limit) and the Clerk webhook (60/min, keyed per source IP
  — a flood guard on a route that does real DB writes on every call, checked
  before the raw-body read + signature verification). Every other route is
  either not paid/third-party-backed or not a plausible flood target at this
  app's scale, so left uncapped — revisit if that changes.
- Webhook routes (e.g. Clerk) verify the signature before acting on the payload.

### Rate limiting fails open, not closed

`checkRateLimit` returns "not limited" whenever `UPSTASH_REDIS_REST_URL`/
`UPSTASH_REDIS_REST_TOKEN` aren't set, or the Upstash call itself errors —
deliberately, so a rate limiter that's misconfigured or briefly unreachable
never becomes the reason a real, already-authenticated user can't use the
app. The tradeoff: **until an Upstash Redis database is provisioned and its
env vars are set on Vercel (Development/Preview/Production), there is
effectively no rate limiting at all** — the code path exists but the store
behind it doesn't. See `.env.example` for how to provision it (Vercel
Marketplace → Upstash integration is the fastest path, sets all three
environments at once). Track whether this has been done for each
environment in `ROADMAP.md`'s open-items list until confirmed.

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
  `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`,
  `Strict-Transport-Security`) are set globally in `vercel.json` (added
  v0.10.0) and reviewed whenever a new external domain (API, CDN, embed) is
  introduced.
- **CSP allowlist, and why each entry is there:** `*.clerk.accounts.dev` /
  `*.clerk.com` (Clerk's frontend API — script/connect/frame — the exact
  subdomain varies per Clerk instance, hence the wildcard); `img.clerk.com`
  (user avatars); `challenges.cloudflare.com` (Clerk's Turnstile
  bot-protection challenge, loaded in an iframe during sign-in — omitting
  this silently breaks sign-in only when Clerk decides to show a challenge,
  easy to miss in casual testing); `clerk-telemetry.com` (Clerk SDK's own
  telemetry beacon).
- **`style-src` includes `'unsafe-inline'` — an accepted, deliberate
  weakening.** Both `styled-components` and MUI's `@emotion/react` inject
  `<style>` tags at runtime (that's how CSS-in-JS works), which a strict
  `style-src` would block entirely, breaking all styling app-wide. A
  nonce-based CSP for CSS-in-JS is possible but needs per-request nonce
  generation threaded through Vite's static build and both styling
  libraries' nonce APIs — a meaningfully bigger lift than this iteration's
  scope. `script-src` has no such exception (no `'unsafe-inline'`/
  `'unsafe-eval'`), so this doesn't weaken protection against injected
  `<script>` execution, only against injected `<style>` — a much
  lower-severity primitive.
- **`frame-ancestors 'none'` + `X-Frame-Options: DENY`:** this app is never
  meant to be embedded in another site's iframe, so clickjacking protection
  is set to the strictest option rather than allowlisting anything.
- **Verify after any Clerk config change:** switching to a custom Clerk
  domain, enabling a new Clerk feature that loads a new third-party script,
  or adding a new OAuth provider's SDK can all silently need a new CSP
  entry — check the browser console for CSP violation reports after any such
  change, not just at ship time.

## Accessibility as part of security/trust

- Not a traditional "security" item, but bundled into the same hardening pass:
  WCAG-level accessibility and reduced-motion support, since this app is explicitly
  built for neurodivergent users and a hostile or overwhelming UI is itself a harm
  this project exists to avoid.
- **v0.10.0 pass — what was actually done, and how:** a targeted review
  (contrast-ratio calculation against the real token values, `grep` sweeps
  for known anti-patterns, manual read-through of every `IconButton`/error
  state) rather than an automated Lighthouse/axe run or manual screen-reader
  testing — neither was done this iteration, so treat this as "concrete
  issues found and fixed," not "certified WCAG AA." Fixed:
  - **Color contrast (WCAG 1.4.3):** light-mode filled-button text
    (`primaryContrast` on `primary`) measured 4.38:1, just under AA's 4.5:1
    minimum for normal text. Fixed by using pure white instead of the
    near-white token previously reused from the background color — see
    `src/theme/tokens.ts`. Every other text/background pairing in both
    light and dark mode already cleared AA (checked all of them, see the
    commit that introduced this fix for the full table).
  - **`<html lang>` not tracking the live language (WCAG 3.1.1):** was
    hardcoded to `"en"` in `index.html` and never updated after a user
    switched to Spanish in Settings — screen readers kept applying English
    pronunciation to Spanish content. Fixed in `src/i18n/i18n.ts`, which now
    keeps `document.documentElement.lang` in sync with i18next on init and
    every `languageChanged` event.
  - **No skip-to-content link (WCAG 2.4.1):** a keyboard user had no way
    past the header (logo + account menu) to a tab's actual content without
    tabbing through it every single time. Added `src/app/SkipLink/` —
    visually hidden until focused, jumps to the `<main>` content region
    (`tabIndex={-1}` there so the hash-jump actually moves focus, not just
    scroll position).
  - **One error state not announced to screen readers:**
    `DeleteAccountDialog`'s inline error text had no `role="alert"` — added
    it, matching the `role="alert"` MUI's `<Alert>` already provides
    elsewhere (e.g. the AI Chat tab's error banner).
  - **What was checked and found already correct:** all 19 `IconButton`
    usages already carry a translated `aria-label`; no `outline: none`
    anywhere (focus rings are never suppressed); no `onClick` on a
    non-interactive element without a matching keyboard handler; reduced
    motion is already handled globally (`src/index.css`, iteration 2); MUI's
    `Dialog`/`Alert` primitives carry their own WAI-ARIA wiring, trusted
    rather than re-verified by hand here — same precedent as trusting
    Clerk's `<SignIn>` for security-sensitive UI.
  - **Explicitly deferred, not done this pass:** an automated
    axe-core/Lighthouse CI check (would need wiring into `.github/workflows/ci.yml`
    or a dedicated script); real screen-reader testing (VoiceOver/NVDA)
    end-to-end; the Dashboard charts' accessible table-view twin (already
    tracked separately, see `docs/CHANGELOG.md`'s Dashboard entry); a full
    keyboard-only walkthrough of every dialog's focus order. Worth a
    dedicated follow-up pass rather than folding into an already-broad
    iteration.
