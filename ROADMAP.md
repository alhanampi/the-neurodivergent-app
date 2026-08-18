# Roadmap

Source of truth for iteration status. The table in `README.md` mirrors this one for
visitors — update both together.

Workflow reminder (full version in [CLAUDE.md](./CLAUDE.md#git-workflow--local-first-one-branch-per-iteration)):
each row below is one branch, built and run locally, approved by the user, and only
then pushed and merged into `main`.

Status legend: `pending` (not started) · `in progress` · `done`.

| Version | Branch                             | Scope                                                                                                                                                                                                                                                                                                           | Status      |
| ------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| v0.1.0  | `iteration/00-repo-bootstrap`      | Repo init, `CLAUDE.md`, `ROADMAP.md`, `docs/`, `README.md`                                                                                                                                                                                                                                                      | done        |
| v0.2.0  | `iteration/01-app-scaffold`        | Vite + React + TS app; oxlint/Prettier/Husky; folder conventions; `vite-plugin-pwa` baseline (manifest + icons); bottom-tab navigation shell (React Router) with 4 placeholder tabs; Vitest + RTL; GitHub Actions CI; Vercel project connected and deployed                                                     | done        |
| v0.3.0  | `iteration/02-i18n-theme`          | react-i18next with `en`/`es` resources; language auto-detect + persisted preference; MUI + styled-components theme bridge; design tokens; light/dark base                                                                                                                                                       | done        |
| v0.4.0  | `iteration/03-auth-clerk`          | Clerk sign-in/up; protected routes; session handling; user menu                                                                                                                                                                                                                                                 | done        |
| v0.5.0  | `iteration/04-database-neon`       | Neon Postgres + Drizzle ORM; schema (`users`, `preferences`); `/api` structure; Clerk webhook syncing user + language preference to DB; migrations workflow                                                                                                                                                     | in progress |
| v0.6.0  | `iteration/05-settings-tab`        | Full Settings tab: language, theme, profile/account (via Clerk), sign out, delete account                                                                                                                                                                                                                       | pending     |
| v0.7.0  | `iteration/06-timers-tab`          | Timer/Pomodoro tab: presets + custom timers, manual start/stop tracking, notifications, session history persisted to Neon                                                                                                                                                                                       | pending     |
| v0.8.0  | `iteration/07-dashboard-tab`       | Dashboard: charts/stats from timer history (MUI X Charts or Recharts), date-range filters                                                                                                                                                                                                                       | pending     |
| v0.9.0  | `iteration/08-ai-chat-tab`         | AI chat tab via Groq (`/api/chat` proxy keeps the key server-side); system prompt is a task-breakdown assistant; streaming back-and-forth; "send plan to Timers" handoff creates timer entries with estimated durations                                                                                         | pending     |
| v0.10.0 | `iteration/09-security-hardening`  | Full `security-review` pass; dependency audit / Dependabot; rate limiting on `/api`; CSP and security headers; accessibility pass (WCAG, reduced motion, ND-friendly UX); bundle code-splitting (MUI/Clerk push the main chunk past 500kB as of v0.4.0)                                                         | pending     |
| v0.11.0 | `iteration/10-gamification`        | Badges/medals (streaks, task completions, daily login); achievements storage; social sharing (Web Share API + share-card image)                                                                                                                                                                                 | pending     |
| v0.12.0 | `iteration/11-google-calendar`     | Google Calendar OAuth; two-way sync between tasks and events                                                                                                                                                                                                                                                    | pending     |
| v0.13.0 | `iteration/12-music-integration`   | Spotify/SoundCloud OAuth; attach playlists to tasks/timers; auto-play for the timer's duration                                                                                                                                                                                                                  | pending     |
| v1.0.0  | `iteration/13-app-store-packaging` | Capacitor/PWABuilder wrap evaluation; store assets; submission prep                                                                                                                                                                                                                                             | pending     |
| v1.1.0  | `iteration/14-model-selection`     | Let the user pick between multiple LLM models for the AI Chat tab for specific uses (e.g. a faster/cheaper model for quick check-ins vs. a stronger reasoning model for harder task breakdowns); model choice becomes a per-conversation or per-preference setting instead of one hardcoded model               | pending     |
| v1.2.0  | `iteration/15-personalization`     | More color themes beyond light/dark; more UI languages beyond en/es; font choice in Settings, including a dyslexia-friendly option (e.g. Atkinson Hyperlegible / OpenDyslexic)                                                                                                                                  | pending     |
| v1.3.0  | `iteration/16-relaxation-tab`      | New tab: guided relaxation/mindfulness exercises (breathing patterns, short grounding exercises — built in-house, no external API) plus curated relaxation music/ambience via embedded public Spotify/SoundCloud playlists, mapped by category (focus, sleep, nature) rather than an algorithmic recommendation | pending     |

## Notes and open decisions

- **Neon/Drizzle setup (iteration 4):** `/db` lives at the repo root, not under
  `src/`, specifically so it can never be imported from client code — only `/api`
  and `drizzle-kit` touch it. Language preference is now genuinely account-synced
  (`GET`/`PUT /api/preferences`, authenticated via a Clerk session token), not just
  seeded once by the webhook, per the promise in CLAUDE.md. Skipped `@vercel/node`
  as a dependency (hand-rolled minimal request/response types instead) — it pulled
  in ~10 transitive CVEs for what we only needed as type declarations. One accepted
  risk remains (`esbuild` via `drizzle-kit`, dev-only, not network-exposed in how we
  use it) — documented in [docs/SECURITY.md](../docs/SECURITY.md#accepted-risks).
  `/api` routes don't run under plain `npm run dev` (Vite doesn't serve them) — use
  `vercel dev` to exercise the webhook/preferences endpoints locally.
- **Vite dev-server blank flash (iteration 4, fixed):** the first time a
  Clerk-authenticated route rendered under `npm run dev`, Vite's dependency
  scanner discovered `@clerk/backend`/`drizzle-orm`/`@neondatabase/serverless`
  as "new dependencies" and force-reloaded the page (a ~1-3s blank flash) —
  confirmed via `src/` having zero references to any of them, and the
  production bundle containing none of them either, so this was dev-server-only.
  Fixed by adding them to `optimizeDeps.exclude` in `vite.config.ts`. Found by
  actually driving the app end-to-end (sign-in → all 4 tabs → language/theme
  toggles → sign out) with Playwright rather than only running `lint`/`test`/
  `build` — worth doing that full pass again for future iterations that touch
  auth or routing.
- **Sign-up gap (found during iteration 4 verification, not fixed — iteration 3
  scope):** the sign-in screen's "Sign up" link bounces out of the app to
  Clerk's generic hosted Account Portal instead of an in-app flow, since only
  `<SignIn>` was ever built, not `<SignUp>`. Doesn't block anything now (new
  users can still sign up, just via an unstyled page) — worth an in-app
  `<SignUp>` component whenever Settings/onboarding gets more attention.
- **Relaxation music source (iteration 16):** researched in Aug 2026. Spotify
  deprecated the `Recommendations`, `Related Artists`, `Audio Features/Analysis`,
  and `Featured Playlists` endpoints for new apps in Nov 2024 — an algorithmic
  "suggest by profile" via Spotify's API isn't available to us. Plan instead: curate
  a small set of public playlists per category (rain, lo-fi/focus, nature,
  instrumental) on both Spotify and SoundCloud, embed via each platform's `iframe`
  widget (no OAuth needed to listen to public content), and map task
  category → sound category ourselves rather than relying on either platform's
  recommendation engine. SoundCloud's `client_id`-based public read access is more
  open than Spotify's post-2024 restrictions, worth leaning on for search/browse.
  [Freesound.org](https://freesound.org/docs/api/overview.html) is a good fit for
  short ambient/nature sound loops behind the breathing exercises specifically —
  free API access is non-commercial only, so revisit if the app ever monetizes.
- **Linter (iteration 1):** used [oxlint](https://oxc.rs/) instead of ESLint —
  `npm create vite@latest` now defaults to it, it's a Rust-based linter that's
  meaningfully faster, and its `react`/`typescript`/`jsx-a11y`/`import` plugins
  cover what this project needs. Prettier still handles formatting; Husky +
  lint-staged still run both on pre-commit. This is a deviation from the
  originally-planned "ESLint/Prettier/Husky" combo — flagged here in case a
  future iteration wants ESLint's larger plugin ecosystem instead.
- **ORM (iteration 4):** Drizzle is the current pick — lighter than Prisma, pairs
  well with Neon's serverless/edge driver. Revisitable if it becomes a poor fit.
- **AI model (iteration 8):** `openai/gpt-oss-120b` on Groq, staying with the
  model the user originally linked. Reasoning: for this feature, quality of task
  breakdown (following instructions, structuring steps sensibly) matters more than
  multilingual certification, and gpt-oss-120b benchmarks meaningfully stronger on
  reasoning/instruction-following than the alternative considered
  (`llama-3.3-70b-versatile`, which is Meta-certified for 8 languages incl. Spanish
  but weaker on reasoning). Its Spanish conversational quality isn't formally
  benchmarked but is expected to be adequate for everyday conversational use; this
  should be validated with real Spanish conversations once the chat tab is built,
  and swapped for the fallback model if tone/quality disappoints — it's a one-line
  config change. There is no sustained free tier for the Claude API, so Groq stays
  the practical "free" choice for this feature.
  - **System prompt requirement:** the assistant's persona must be spelled out
    explicitly in the system prompt, not left to model defaults — warm, encouraging,
    non-judgmental tone; explicitly a task-breakdown helper (turns a task, including
    everyday/domestic ones, into small, concrete, non-overwhelming steps); asks
    clarifying questions before proposing a plan; never scolds or implies the user
    should already know how to do this. This applies regardless of which model
    backs the chat, so tone stays consistent even if the model is swapped.
  - **Future: model selection (v1.1.0, see `iteration/14-model-selection` below).**
    Once the app is stable post-v1.0, let the user pick from a small set of models
    for different needs (e.g. quick/cheap vs. stronger reasoning for a hard task).
    Keep this list short and curated rather than exposing Groq's whole catalog —
    each option should have a clear, plain-language reason to pick it.
- **Security gate:** iteration 9 (security hardening) is a deliberate gate before
  gamification/social features and before the OAuth-based integrations (10–12),
  since those add external tokens and public sharing surfaces.
- Scope per iteration is a starting point, not a contract carved in stone — if
  something in a row turns out to depend on a later row, say so before starting
  rather than quietly reordering.
