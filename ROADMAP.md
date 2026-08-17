# Roadmap

Source of truth for iteration status. The table in `README.md` mirrors this one for
visitors — update both together.

Workflow reminder (full version in [CLAUDE.md](./CLAUDE.md#git-workflow--local-first-one-branch-per-iteration)):
each row below is one branch, built and run locally, approved by the user, and only
then pushed and merged into `main`.

Status legend: `pending` (not started) · `in progress` · `done`.

| Version | Branch | Scope | Status |
|---|---|---|---|
| v0.1.0 | `iteration/00-repo-bootstrap` | Repo init, `CLAUDE.md`, `ROADMAP.md`, `docs/`, `README.md` | in progress |
| v0.2.0 | `iteration/01-app-scaffold` | Vite + React + TS app; ESLint/Prettier/Husky; folder conventions; `vite-plugin-pwa` baseline (manifest + icons); bottom-tab navigation shell (React Router) with 4 placeholder tabs; Vitest + RTL; GitHub Actions CI; Vercel project connected and deployed | pending |
| v0.3.0 | `iteration/02-i18n-theme` | react-i18next with `en`/`es` resources; language auto-detect + persisted preference; MUI + styled-components theme bridge; design tokens; light/dark base | pending |
| v0.4.0 | `iteration/03-auth-clerk` | Clerk sign-in/up; protected routes; session handling; user menu | pending |
| v0.5.0 | `iteration/04-database-neon` | Neon Postgres + Drizzle ORM; schema (`users`, `preferences`); `/api` structure; Clerk webhook syncing user + language preference to DB; migrations workflow | pending |
| v0.6.0 | `iteration/05-settings-tab` | Full Settings tab: language, theme, profile/account (via Clerk), sign out, delete account | pending |
| v0.7.0 | `iteration/06-timers-tab` | Timer/Pomodoro tab: presets + custom timers, manual start/stop tracking, notifications, session history persisted to Neon | pending |
| v0.8.0 | `iteration/07-dashboard-tab` | Dashboard: charts/stats from timer history (MUI X Charts or Recharts), date-range filters | pending |
| v0.9.0 | `iteration/08-ai-chat-tab` | AI chat tab via Groq (`/api/chat` proxy keeps the key server-side); system prompt is a task-breakdown assistant; streaming back-and-forth; "send plan to Timers" handoff creates timer entries with estimated durations | pending |
| v0.10.0 | `iteration/09-security-hardening` | Full `security-review` pass; dependency audit / Dependabot; rate limiting on `/api`; CSP and security headers; accessibility pass (WCAG, reduced motion, ND-friendly UX) | pending |
| v0.11.0 | `iteration/10-gamification` | Badges/medals (streaks, task completions, daily login); achievements storage; social sharing (Web Share API + share-card image) | pending |
| v0.12.0 | `iteration/11-google-calendar` | Google Calendar OAuth; two-way sync between tasks and events | pending |
| v0.13.0 | `iteration/12-music-integration` | Spotify/SoundCloud OAuth; attach playlists to tasks/timers; auto-play for the timer's duration | pending |
| v1.0.0 | `iteration/13-app-store-packaging` | Capacitor/PWABuilder wrap evaluation; store assets; submission prep | pending |

## Notes and open decisions

- **ORM (iteration 4):** Drizzle is the current pick — lighter than Prisma, pairs
  well with Neon's serverless/edge driver. Revisitable if it becomes a poor fit.
- **AI model (iteration 8):** default is `openai/gpt-oss-120b` on Groq (the model
  the user linked), chosen for its multilingual quality, matching the en/es
  requirement. `llama-3.3-70b-versatile` is the fallback if quality or rate limits
  are an issue. There is no sustained free tier for the Claude API, so Groq is the
  practical "free" choice for this feature.
- **Security gate:** iteration 9 (security hardening) is a deliberate gate before
  gamification/social features and before the OAuth-based integrations (10–12),
  since those add external tokens and public sharing surfaces.
- Scope per iteration is a starting point, not a contract carved in stone — if
  something in a row turns out to depend on a later row, say so before starting
  rather than quietly reordering.
