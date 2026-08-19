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
      AiChatTab.tsx            # Sidebar toggle + message list + composer +
      useAiChatTab.ts            # plan preview; streams /api/chat token by
      AiChatTab.styles.ts        # token (SSE), one flat state+handlers object
      AiChatTab.interfaces.ts    # from the hook (mirrors useTimersTab's shape)
      AiChatTab.constants.ts
      AiChatTab.utils.ts         # parseSseChunk, groupConversationsByDate
      useAiChatTab.utils.ts      # fetch/stream/plan network calls
      ConversationSidebar/       # Drawer: date-grouped list, rename, delete
        DeleteConversationDialog/  # Mirrors timers/StopTimerDialog
      MessageBubble/            # react-markdown for assistant replies only
      Composer/
      PlanPreviewCard/          # Editable plan steps before "Send to Tasks" —
                                  # reuses timers/MinutesInput (same client
                                  # bundle, see DashboardTab's own precedent)
    tasks/
      TasksTab.tsx             # Flat checklist — no timer, on purpose (see
      useTasksTab.ts             # ROADMAP.md's iteration 8 notes); optimistic
      TasksTab.styles.ts         # toggle/delete with rollback on failure
      TasksTab.interfaces.ts
      useTasksTab.utils.ts
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
api/                    # Vercel Serverless Functions (secrets live here, never in src/).
                          # Only route handlers live directly under api/ — see the
                          # api/_lib note below for why.
  preferences.ts         # GET/PUT the signed-in user's preferences
  timer-sessions.ts      # GET/POST the signed-in user's timer session history
  chat.ts                # POST — streams a Groq reply over SSE, persists both
                          # turns; system prompt rebuilt fresh per request
  chat-plan.ts            # POST — separate, non-streaming, JSON-mode call that
                            # structures a conversation into {title,minutes} steps
  conversations.ts        # GET — list the signed-in user's conversations
  conversations/[id].ts    # GET messages / PUT rename / DELETE one conversation
  tasks.ts                # GET list / POST create-from-plan
  tasks/[id].ts            # PATCH toggle completed / DELETE one task
  webhooks/
    clerk.ts             # Clerk → Neon user/preferences sync
  _lib/                  # Everything that ISN'T a route handler: .utils.ts,
                          # .interfaces.ts, .constants.ts, auth.utils.ts,
                          # groq.client.ts, vercel-http.interfaces.ts,
                          # webhooks/clerk.utils.ts + clerk.interfaces.ts. See
                          # the note right after this tree for why this split
                          # exists — it's load-bearing, not just tidiness.
db/                     # Server-only: Drizzle schema + Neon client. Imported only
  schema.ts               # from api/ and drizzle-kit — never from src/, since
  client.ts               # anything src/ imports ships to the browser.
e2e/                    # Playwright specs — need `vercel dev`, not plain `npm run dev`
  global-setup.ts         # Fetches a Clerk testing token (@clerk/testing/playwright)
  chat-to-tasks.spec.ts    # Chat → plan → Tasks handoff; test.skip()s without a
                            # Clerk test-mode user (E2E_CLERK_TEST_EMAIL/PASSWORD)
docs/
```

Every file under `api/`/`db/` uses explicit `.js` extensions on relative
imports — required by how Vercel's per-function build resolves modules (see
ROADMAP.md's "Vercel build failing" note). `api/chat.ts` is the one route
that isn't a JSON envelope: it streams Server-Sent Events (`data: {...}\n\n`
frames), the only place in this project doing that.

**Why `api/_lib/` exists:** Vercel's zero-config `/api` convention treats
_every_ file directly under `api/` (and its subfolders) as its own
Serverless Function, regardless of whether it exports a route handler — a
`.utils.ts` or `.interfaces.ts` sibling counts exactly the same as a real
route. The Hobby plan caps a deployment at 12 Functions total. This
project's file-split convention (CLAUDE.md) puts 2-4 support files next to
every route, so without `_lib/` a handful of routes alone would blow the
limit — which is exactly what happened (see ROADMAP.md's iteration 8 notes:
production silently started failing to deploy once the file count crossed
12, well before this iteration added anything). Vercel excludes any
underscore-prefixed file or folder from Function detection, so every
non-handler file lives under `api/_lib/` instead — only genuine route
handlers stay directly in `api/`. When adding a new route, its `.ts` handler
goes in `api/` (or `api/<segment>/`); everything else it needs goes in
`api/_lib/`.

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
- **Bottom tab bar** (mobile-first, four tabs — Timers, AI Chat, Tasks,
  Dashboard). Tasks was added in iteration 8 as the destination for plans
  built in AI Chat (see ROADMAP.md's iteration 8 notes for why that landed as
  its own tab instead of feeding the Timers tab as originally scoped) — the
  first deviation from the three-tab count set in iteration 5, when Settings
  moved out to the header specifically to keep the bar at three. Settings
  isn't one of them; it's reached only via the header, since it's an
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
   │     ├─ /api/chat            → verifies the Clerk token, reads/writes Neon
   │     │                          (conversation + message rows), streams a
   │     │                          Groq reply back over SSE (API key stays
   │     │                          server-side)
   │     ├─ /api/chat-plan       → verifies the Clerk token, reads Neon
   │     │                          (conversation history), one non-streaming
   │     │                          JSON-mode Groq call — no Neon writes
   │     ├─ /api/conversations       → verifies the Clerk token, lists the
   │     │  /api/conversations/[id]    user's conversations / messages / rename
   │     │                             / delete one, all in Neon
   │     ├─ /api/tasks               → verifies the Clerk token, lists /
   │     │  /api/tasks/[id]            creates tasks from an approved plan /
   │     │                             toggles completed / deletes one, all in
   │     │                             Neon
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
