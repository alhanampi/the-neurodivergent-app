# Architecture

## Folder structure

```
src/
  app/                  # App shell: router, providers, bottom tab navigation
  auth/                 # AuthGate (gates the app on Clerk sign-in), SignInScreen
  features/
    timers/
      TimersTab.tsx
      useTimersTab.ts
      TimersTab.styles.ts
      TimersTab.interfaces.ts
      TimersTab.utils.ts
    ai-chat/
    dashboard/
    settings/
  components/           # Shared, cross-feature UI building blocks (same file split)
  hooks/                # Shared hooks not tied to one feature
  i18n/
    locales/en/, locales/es/
  theme/                # MUI theme + styled-components ThemeProvider bridge, design tokens
  utils/                # Cross-feature pure helpers
api/                    # Vercel Serverless Functions (secrets live here, never in src/)
  preferences.ts         # GET/PUT the signed-in user's preferences
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

Bottom tab bar (mobile-first) with four tabs, added incrementally per the roadmap:
Timers, AI Chat, Dashboard, Settings. Routing via React Router; the tab bar and
route definitions live in `src/app/`.

## Data flow

```
Browser (React)
   │
   ├─ Clerk SDK ── auth/session, directly from the client; getToken() attaches
   │                a session JWT to authenticated /api calls
   │
   ├─ /api/* (Vercel Serverless Functions)
   │     ├─ /api/chat          → Groq (API key stays server-side)
   │     ├─ /api/preferences   → verifies the Clerk token, reads/writes Neon
   │     └─ /api/webhooks/*    → Clerk webhook (svix-verified) → Neon,
   │                              upserts/deletes the user + preferences rows
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
