# Architecture

## Folder structure

```
src/
  app/                  # App shell: router, providers, bottom tab navigation
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
    en/
    es/
  theme/                # MUI theme + styled-components ThemeProvider bridge, design tokens
  lib/                  # Thin clients: Clerk, Neon/Drizzle, Groq — no business logic
  utils/                # Cross-feature pure helpers
api/                    # Vercel Serverless Functions (secrets live here, never in src/)
  chat.ts               # Groq proxy
  webhooks/
    clerk.ts
docs/
```

Every feature tab under `src/features/<tab>/` follows the file-split convention
from [CLAUDE.md](../CLAUDE.md#file-separation): thin `.tsx`, logic in a hook,
styles/types/utils in their own files.

## Navigation shell

Bottom tab bar (mobile-first) with four tabs, added incrementally per the roadmap:
Timers, AI Chat, Dashboard, Settings. Routing via React Router; the tab bar and
route definitions live in `src/app/`.

## Data flow

```
Browser (React)
   │
   ├─ Clerk SDK ── auth/session, directly from the client
   │
   ├─ /api/* (Vercel Serverless Functions)
   │     ├─ /api/chat        → Groq (API key stays server-side)
   │     ├─ /api/webhooks/*  → Clerk webhook → Neon (sync user + preferences)
   │     └─ /api/...         → Neon (Drizzle) for reads/writes the client
   │                            shouldn't do directly
   │
   └─ Neon Postgres ── reached only from /api, never directly from the browser
```

Rule of thumb: if it needs a secret or should be authorized server-side, it's a
route under `/api`. Everything else (auth state, UI state, i18n) can live in the
client.

## PWA

`vite-plugin-pwa` provides the manifest and service worker (added in iteration 1).
Notifications for timers use the Web Notifications API through the service worker
so alerts can fire even if the tab isn't focused.
