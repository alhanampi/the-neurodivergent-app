# Architecture

## Folder structure

```
src/
  app/                  # App shell: router, providers, fixed header, bottom tab nav
    Header/               # Always rendered (signed in or not): logo+name, and once
                            # signed in, avatar (UserButton) + Settings shortcut
  auth/                 # AuthGate (gates the app on Clerk sign-in), SignInScreen
  features/
    timers/
      TimersTab.tsx
      useTimersTab.ts
      TimersTab.styles.ts
      TimersTab.interfaces.ts
      TimersTab.utils.ts
      StopTimerDialog/       # Confirmation before stopping a timer with progress
    ai-chat/
    dashboard/
      DashboardTab.tsx        # Stat tiles + @mui/x-charts bar charts (time
      useDashboardTab.ts        # spent, by-preset breakdown), date-range filter
      DashboardTab.styles.ts
      DashboardTab.interfaces.ts # Reuses TimerSession/TimerPresetId from
      DashboardTab.utils.ts      # timers/ (same client bundle, not a
      useDashboardTab.utils.ts   # server-boundary crossing) rather than
                                  # duplicating them
    settings/
  components/           # Shared, cross-feature UI building blocks (same file split)
  hooks/                # Shared hooks not tied to one feature
  i18n/
    locales/en/, locales/es/
  theme/                # MUI theme + styled-components ThemeProvider bridge, design tokens
  utils/                # Cross-feature pure helpers
api/                    # Vercel Serverless Functions (secrets live here, never in src/)
  auth.utils.ts          # Shared Clerk token verification, used by every authenticated route
  preferences.ts         # GET/PUT the signed-in user's preferences
  timer-sessions.ts      # GET/POST the signed-in user's timer session history
  webhooks/
    clerk.ts             # Clerk → Neon user/preferences sync
db/                     # Server-only: Drizzle schema + Neon client. Imported only
  schema.ts               # from api/ and drizzle-kit — never from src/, since
  client.ts               # anything src/ imports ships to the browser.
docs/
```

Every feature tab under `src/features/<tab>/` follows the file-split convention
from [CLAUDE.md](../CLAUDE.md#file-separation): thin `.tsx`, logic in a hook,
styles/types/utils in their own files. `api/` and `db/` adapt the same spirit for
backend code — thin handler, logic in `.utils.ts`, types in `.interfaces.ts` — with
one documented exception: `db/schema.ts` combines table definitions and their
inferred types in one file, since that's how Drizzle itself is meant to be used.

## Navigation shell

Two pieces of fixed chrome, both from `src/theme/tokens.ts`'s `layout` heights so
they never drift out of sync with the content padding around them:

- **Header** (top, always rendered — see `src/app/Header/`): app logo/name on the
  left; once signed in, the account avatar (Clerk's `<UserButton>`) and a Settings
  shortcut on the right. Present on the sign-in screen too, just without the
  account controls.
- **Bottom tab bar** (mobile-first, three tabs — Timers, AI Chat, Dashboard).
  Settings isn't one of them; it's reached only via the header, since it's an
  account-level concern rather than a core feature tab.

Routing via React Router; the tab bar and route definitions live in `src/app/`.

## Data flow

```
Browser (React)
   │
   ├─ Clerk SDK ── auth/session, directly from the client; getToken() attaches
   │                a session JWT to authenticated /api calls
   │
   ├─ /api/* (Vercel Serverless Functions)
   │     ├─ /api/chat            → Groq (API key stays server-side)
   │     ├─ /api/preferences     → verifies the Clerk token, reads/writes Neon
   │     ├─ /api/timer-sessions  → verifies the Clerk token, reads/writes Neon
   │     │                          (GET recent history — or, with
   │     │                          ?startDate&endDate, every session in that
   │     │                          range for the Dashboard tab — POST a
   │     │                          finished run)
   │     └─ /api/webhooks/*      → Clerk webhook (svix-verified) → Neon,
   │                                upserts/deletes the user + preferences rows
   │
   └─ Neon Postgres ── reached only from /api (via db/client.ts), never
                        directly from the browser
```

Rule of thumb: if it needs a secret or should be authorized server-side, it's a
route under `/api`. Everything else (auth state, UI state, i18n) can live in the
client.

## PWA

`vite-plugin-pwa` provides the manifest and service worker (added in iteration 1).
Notifications for timers use the Web Notifications API through the service worker
so alerts can fire even if the tab isn't focused.
