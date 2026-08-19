# Roadmap

Source of truth for iteration status. The table in `README.md` mirrors this one for
visitors — update both together.

Workflow reminder (full version in [CLAUDE.md](./CLAUDE.md#git-workflow--local-first-one-branch-per-iteration)):
each row below is one branch, built and run locally, approved by the user, and only
then pushed and merged into `main`.

Status legend: `pending` (not started) · `in progress` · `done`.

| Version | Branch                             | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Status      |
| ------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| v0.1.0  | `iteration/00-repo-bootstrap`      | Repo init, `CLAUDE.md`, `ROADMAP.md`, `docs/`, `README.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                              | done        |
| v0.2.0  | `iteration/01-app-scaffold`        | Vite + React + TS app; oxlint/Prettier/Husky; folder conventions; `vite-plugin-pwa` baseline (manifest + icons); bottom-tab navigation shell (React Router) with 4 placeholder tabs; Vitest + RTL; GitHub Actions CI; Vercel project connected and deployed                                                                                                                                                                                                                                                             | done        |
| v0.3.0  | `iteration/02-i18n-theme`          | react-i18next with `en`/`es` resources; language auto-detect + persisted preference; MUI + styled-components theme bridge; design tokens; light/dark base                                                                                                                                                                                                                                                                                                                                                               | done        |
| v0.4.0  | `iteration/03-auth-clerk`          | Clerk sign-in/up; protected routes; session handling; user menu                                                                                                                                                                                                                                                                                                                                                                                                                                                         | done        |
| v0.5.0  | `iteration/04-database-neon`       | Neon Postgres + Drizzle ORM; schema (`users`, `preferences`); `/api` structure; Clerk webhook syncing user + language preference to DB; migrations workflow                                                                                                                                                                                                                                                                                                                                                             | done        |
| v0.6.0  | `iteration/05-settings-tab`        | Full Settings tab: language, theme, profile/account (via Clerk), sign out, delete account; plus a fixed header (app identity, avatar, Settings shortcut) and the bottom nav trimmed to 3 tabs                                                                                                                                                                                                                                                                                                                           | done        |
| v0.7.0  | `iteration/06-timers-tab`          | Timer/Pomodoro tab: presets + custom timers, manual start/stop tracking, notifications, session history persisted to Neon                                                                                                                                                                                                                                                                                                                                                                                               | done        |
| v0.8.0  | `iteration/07-dashboard-tab`       | Dashboard: charts/stats from timer history (MUI X Charts or Recharts), date-range filters                                                                                                                                                                                                                                                                                                                                                                                                                               | done        |
| v0.9.0  | `iteration/08-ai-chat-tab`         | AI chat tab via Groq (`/api/chat` proxy keeps the key server-side); system prompt is a task-breakdown assistant; streaming back-and-forth; "send plan to Tasks" handoff creates a Task + Subtasks with realistic estimated durations, priorities, and due dates (destination changed from the originally-scoped Timers tab to a new Tasks tab, then reshaped mid-iteration into a task/subtask hierarchy with persisted per-subtask timers — see notes below)                                                           | done        |
| v0.9.5  | `iteration/08b-timers-rethink`     | Timers tab redesign: Pomodoro becomes the tab's default/primary flow instead of one of four equal presets; timers gain an optional link/label to a real Task or Subtask; AI Chat's plan preview gains a "Start a Pomodoro now" option alongside "Send to Tasks" that launches a Timers session directly (no Task rows created) using Pomodoro-shaped step estimates instead of raw minutes — Tasks and its subtask mini-timer are unchanged; also folded the header's avatar+gear pair into one unified account control | done        |
| v0.10.0 | `iteration/09-security-hardening`  | Full `security-review` pass; dependency audit / Dependabot; rate limiting on `/api`; CSP and security headers; accessibility pass (WCAG, reduced motion, ND-friendly UX); bundle code-splitting (MUI/Clerk push the main chunk past 500kB as of v0.4.0)                                                                                                                                                                                                                                                                 | in progress |
| v0.11.0 | `iteration/10-gamification`        | Badges/medals (streaks, task completions, daily login); achievements storage; social sharing (Web Share API + share-card image)                                                                                                                                                                                                                                                                                                                                                                                         | pending     |
| v0.12.0 | `iteration/11-google-calendar`     | Google Calendar OAuth; two-way sync between tasks and events                                                                                                                                                                                                                                                                                                                                                                                                                                                            | pending     |
| v0.13.0 | `iteration/12-music-integration`   | Spotify/SoundCloud OAuth; attach playlists to tasks/timers; auto-play for the timer's duration                                                                                                                                                                                                                                                                                                                                                                                                                          | pending     |
| v1.0.0  | `iteration/13-app-store-packaging` | Capacitor/PWABuilder wrap evaluation; store assets; submission prep                                                                                                                                                                                                                                                                                                                                                                                                                                                     | pending     |
| v1.1.0  | `iteration/14-model-selection`     | Let the user pick between multiple LLM models for the AI Chat tab for specific uses (e.g. a faster/cheaper model for quick check-ins vs. a stronger reasoning model for harder task breakdowns); model choice becomes a per-conversation or per-preference setting instead of one hardcoded model                                                                                                                                                                                                                       | pending     |
| v1.2.0  | `iteration/15-personalization`     | More color themes beyond light/dark; more UI languages beyond en/es; font choice in Settings, including a dyslexia-friendly option (e.g. Atkinson Hyperlegible / OpenDyslexic)                                                                                                                                                                                                                                                                                                                                          | pending     |
| v1.3.0  | `iteration/16-relaxation-tab`      | New tab: guided relaxation/mindfulness exercises with custom animations (box/square breathing, expanding-wave breathing, short grounding exercises — built in-house, no external API, timed animation paced to the actual breathing count) plus curated relaxation music/ambience via embedded public Spotify/SoundCloud playlists, mapped by category (focus, sleep, nature) rather than an algorithmic recommendation                                                                                                 | pending     |
| v1.4.0  | `iteration/17-task-roulette`       | New tab: user enters pending tasks with a difficulty level, spins a wheel (`react-custom-roulette`) to randomly get one to work on; harder tasks earn more points; user sets a points threshold that triggers a break suggestion + prompt to share the earned badge on social media; task selection is weighted by time-of-day relevance (e.g. a task tagged "buy groceries" gets a higher chance of coming up near store-closing time than a non-time-sensitive one)                                                   | pending     |

## Notes and open decisions

Full iteration-by-iteration build history (bugs found, design revisions, exact
reasoning behind what changed) lives in [docs/CHANGELOG.md](./docs/CHANGELOG.md)
— kept out of this file on purpose, since `CLAUDE.md` requires re-reading
`ROADMAP.md` at the start of every session, and that history doesn't need to be
in every session's context. Evergreen technical-decision rationale (linter, ORM,
AI model choice) lives in
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#key-technical-decisions). This
section keeps only what's still open, unresolved, or decided-but-not-yet-built.

- **Open: Production/Preview Vercel env vars.** `CLERK_SECRET_KEY`,
  `GROQ_API_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` are
  registered for the Development environment only (found iteration 8, see
  [docs/CHANGELOG.md](./docs/CHANGELOG.md#local-only-clerkgroq-keys-never-reached-vercel)).
  Must be added for Production/Preview before anything depending on them works
  in a real deploy — check this before iteration 9 wraps up.
- **Open: Upstash Redis not provisioned yet.** Iteration 9 added rate
  limiting on `/api/chat`, `/api/chat-plan`, and the Clerk webhook, backed by
  Upstash Redis — but the account/database doesn't exist yet, so
  `UPSTASH_REDIS_REST_URL`/`_TOKEN` aren't set anywhere. The code fails open
  without them (see
  [docs/SECURITY.md](./docs/SECURITY.md#rate-limiting-fails-open-not-closed)),
  so this doesn't block the app working, but means there's no real rate
  limiting yet. **User to set up** (Vercel dashboard → Storage/Marketplace →
  Upstash integration is the fastest path); confirm it's live in
  Development/Preview/Production before closing this item.
- **Open: sign-up bounces to Clerk's hosted Account Portal** instead of an
  in-app screen (only `<SignIn>` was built, not `<SignUp>`, iteration 3
  scope). Doesn't block new users, just unstyled. Worth an in-app `<SignUp>`
  whenever Settings/onboarding gets more attention.
- **Security gate:** iteration 9 (security hardening) is a deliberate gate
  before gamification/social features and before the OAuth-based integrations
  (10–12), since those add external tokens and public sharing surfaces.
- **Iteration 16 (relaxation tab) prep — music source, researched Aug 2026:**
  Spotify deprecated the `Recommendations`/`Related Artists`/`Audio
Features`/`Featured Playlists` endpoints for new apps in Nov 2024, so an
  algorithmic "suggest by profile" isn't available. Plan: curate a small set
  of public playlists per category (rain, lo-fi/focus, nature, instrumental)
  on both Spotify and SoundCloud, embed via each platform's `iframe` widget
  (no OAuth needed for public content), map task category → sound category
  ourselves. SoundCloud's `client_id`-based public read access is more open
  than Spotify's post-2024 restrictions. [Freesound.org](https://freesound.org/docs/api/overview.html)
  is a good fit for short ambient/nature loops behind the breathing exercises
  — free API access is non-commercial only, revisit if the app ever
  monetizes.
- **Iteration 16 prep — animation library, not yet committed:** candidates to
  evaluate when this iteration starts: `motion` (formerly `framer-motion`,
  most mature, ~50-60kB gzip), `@react-spring/web` (physics-based, similar
  weight), `lottie-react` (pre-made designer assets vs. code control), or
  plain CSS/styled-components keyframes (zero dependency, fine for a simple
  expanding circle). Whichever it is, lazy-load it (`import()`). Must respect
  the `prefers-reduced-motion` handling already in `src/index.css`
  (iteration 2) — replace the moving shape with a static one plus a
  text/number countdown, not skip the exercise content.
- **Iteration 17 (task roulette) prep:** depends on the gamification system
  (iteration 10) and the Timers tab (iteration 6) already being in place —
  it's a consumer of both, which is why it sits after them despite the user
  originally suggesting v1.3.0 (already taken by the relaxation tab).
  Suggested package `react-custom-roulette` (zero runtime deps, MIT) hadn't
  published in over a year as of Aug 2026 — recheck it's still the best
  option (not abandoned, no newer alternative) when this iteration starts.
- Scope per iteration is a starting point, not a contract carved in stone — if
  something in a row turns out to depend on a later row, say so before
  starting rather than quietly reordering.
