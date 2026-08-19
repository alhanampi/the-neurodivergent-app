# Roadmap

Source of truth for iteration status. The table in `README.md` mirrors this one for
visitors — update both together.

Workflow reminder (full version in [CLAUDE.md](./CLAUDE.md#git-workflow--local-first-one-branch-per-iteration)):
each row below is one branch, built and run locally, approved by the user, and only
then pushed and merged into `main`.

Status legend: `pending` (not started) · `in progress` · `done`.

| Version | Branch                             | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Status  |
| ------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| v0.1.0  | `iteration/00-repo-bootstrap`      | Repo init, `CLAUDE.md`, `ROADMAP.md`, `docs/`, `README.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                              | done    |
| v0.2.0  | `iteration/01-app-scaffold`        | Vite + React + TS app; oxlint/Prettier/Husky; folder conventions; `vite-plugin-pwa` baseline (manifest + icons); bottom-tab navigation shell (React Router) with 4 placeholder tabs; Vitest + RTL; GitHub Actions CI; Vercel project connected and deployed                                                                                                                                                                                                                                                             | done    |
| v0.3.0  | `iteration/02-i18n-theme`          | react-i18next with `en`/`es` resources; language auto-detect + persisted preference; MUI + styled-components theme bridge; design tokens; light/dark base                                                                                                                                                                                                                                                                                                                                                               | done    |
| v0.4.0  | `iteration/03-auth-clerk`          | Clerk sign-in/up; protected routes; session handling; user menu                                                                                                                                                                                                                                                                                                                                                                                                                                                         | done    |
| v0.5.0  | `iteration/04-database-neon`       | Neon Postgres + Drizzle ORM; schema (`users`, `preferences`); `/api` structure; Clerk webhook syncing user + language preference to DB; migrations workflow                                                                                                                                                                                                                                                                                                                                                             | done    |
| v0.6.0  | `iteration/05-settings-tab`        | Full Settings tab: language, theme, profile/account (via Clerk), sign out, delete account; plus a fixed header (app identity, avatar, Settings shortcut) and the bottom nav trimmed to 3 tabs                                                                                                                                                                                                                                                                                                                           | done    |
| v0.7.0  | `iteration/06-timers-tab`          | Timer/Pomodoro tab: presets + custom timers, manual start/stop tracking, notifications, session history persisted to Neon                                                                                                                                                                                                                                                                                                                                                                                               | done    |
| v0.8.0  | `iteration/07-dashboard-tab`       | Dashboard: charts/stats from timer history (MUI X Charts or Recharts), date-range filters                                                                                                                                                                                                                                                                                                                                                                                                                               | done    |
| v0.9.0  | `iteration/08-ai-chat-tab`         | AI chat tab via Groq (`/api/chat` proxy keeps the key server-side); system prompt is a task-breakdown assistant; streaming back-and-forth; "send plan to Tasks" handoff creates a Task + Subtasks with realistic estimated durations, priorities, and due dates (destination changed from the originally-scoped Timers tab to a new Tasks tab, then reshaped mid-iteration into a task/subtask hierarchy with persisted per-subtask timers — see notes below)                                                           | done    |
| v0.9.5  | `iteration/08b-timers-rethink`     | Timers tab redesign: Pomodoro becomes the tab's default/primary flow instead of one of four equal presets; timers gain an optional link/label to a real Task or Subtask; AI Chat's plan preview gains a "Start a Pomodoro now" option alongside "Send to Tasks" that launches a Timers session directly (no Task rows created) using Pomodoro-shaped step estimates instead of raw minutes — Tasks and its subtask mini-timer are unchanged; also folded the header's avatar+gear pair into one unified account control | done    |
| v0.10.0 | `iteration/09-security-hardening`  | Full `security-review` pass; dependency audit / Dependabot; rate limiting on `/api`; CSP and security headers; accessibility pass (WCAG, reduced motion, ND-friendly UX); bundle code-splitting (MUI/Clerk push the main chunk past 500kB as of v0.4.0)                                                                                                                                                                                                                                                                 | pending |
| v0.11.0 | `iteration/10-gamification`        | Badges/medals (streaks, task completions, daily login); achievements storage; social sharing (Web Share API + share-card image)                                                                                                                                                                                                                                                                                                                                                                                         | pending |
| v0.12.0 | `iteration/11-google-calendar`     | Google Calendar OAuth; two-way sync between tasks and events                                                                                                                                                                                                                                                                                                                                                                                                                                                            | pending |
| v0.13.0 | `iteration/12-music-integration`   | Spotify/SoundCloud OAuth; attach playlists to tasks/timers; auto-play for the timer's duration                                                                                                                                                                                                                                                                                                                                                                                                                          | pending |
| v1.0.0  | `iteration/13-app-store-packaging` | Capacitor/PWABuilder wrap evaluation; store assets; submission prep                                                                                                                                                                                                                                                                                                                                                                                                                                                     | pending |
| v1.1.0  | `iteration/14-model-selection`     | Let the user pick between multiple LLM models for the AI Chat tab for specific uses (e.g. a faster/cheaper model for quick check-ins vs. a stronger reasoning model for harder task breakdowns); model choice becomes a per-conversation or per-preference setting instead of one hardcoded model                                                                                                                                                                                                                       | pending |
| v1.2.0  | `iteration/15-personalization`     | More color themes beyond light/dark; more UI languages beyond en/es; font choice in Settings, including a dyslexia-friendly option (e.g. Atkinson Hyperlegible / OpenDyslexic)                                                                                                                                                                                                                                                                                                                                          | pending |
| v1.3.0  | `iteration/16-relaxation-tab`      | New tab: guided relaxation/mindfulness exercises with custom animations (box/square breathing, expanding-wave breathing, short grounding exercises — built in-house, no external API, timed animation paced to the actual breathing count) plus curated relaxation music/ambience via embedded public Spotify/SoundCloud playlists, mapped by category (focus, sleep, nature) rather than an algorithmic recommendation                                                                                                 | pending |
| v1.4.0  | `iteration/17-task-roulette`       | New tab: user enters pending tasks with a difficulty level, spins a wheel (`react-custom-roulette`) to randomly get one to work on; harder tasks earn more points; user sets a points threshold that triggers a break suggestion + prompt to share the earned badge on social media; task selection is weighted by time-of-day relevance (e.g. a task tagged "buy groceries" gets a higher chance of coming up near store-closing time than a non-time-sensitive one)                                                   | pending |

## Notes and open decisions

- **Production was down: Vercel's 12-Function Hobby limit, `api/_lib/` fix
  (found overnight during iteration 8, fixed on `main` and iteration 8
  together):** while testing iteration 8 locally, discovered `main`'s last
  3 production deploys (in the ~20h before this was found) had all been
  silently failing with `exceeded_serverless_functions_per_deployment` —
  Vercel's Hobby plan caps a deployment at 12 Serverless Functions, and
  Vercel's zero-config `/api` convention counts _every_ file directly under
  `api/` (not just route handlers) as its own Function. This project's
  file-split convention (CLAUDE.md) gives every route 2-4 sibling files
  (`.utils.ts`, `.interfaces.ts`, `.constants.ts`), so `main` alone was
  already at 11 files before this iteration added anything — the first
  deploy that pushed past that (a routine merge, nothing unusual about it)
  started failing with no visible signal short of checking deploy status by
  hand. Iteration 8 alone would have added ~19 more files, making this
  impossible to ignore. Fix: moved every non-handler file into `api/_lib/`
  (Vercel excludes underscore-prefixed paths from Function detection),
  leaving only genuine route handlers directly under `api/` — 9 total after
  this iteration, comfortably under the cap. See
  [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the folder layout and
  the full explanation; every relative import across `api/` was
  mechanically rewritten to match (verified via `typecheck`/`lint`/`test`/
  `build`, all clean). Also found and fixed while chasing this: `vite.config.ts`'s
  Vitest `test` block had no `exclude` for `e2e/`, so Vitest tried (and
  failed) to execute the new Playwright spec as one of its own tests —
  added `exclude: ['**/node_modules/**', '**/dist/**', './e2e/**']`.
  **This needs to reach `main`/production on its own** (independent of
  whether iteration 8 ships yet) since production is down until it does —
  flagged to the user as soon as found rather than silently worked around.
- **Local-only Clerk/Groq keys never reached Vercel (found same night):**
  `CLERK_SECRET_KEY`, `GROQ_API_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` had
  only ever been added to `.env.local` by hand, never registered on the
  Vercel project itself — `vercel dev` builds a function's runtime env from
  Vercel Cloud's registered variables (matching the target environment),
  not from arbitrary local-only additions to `.env.local`, so every
  authenticated route 401'd locally regardless of a valid session. Fixed by
  `vercel env add` for the Development environment. **Still open:** these
  three (plus `CLERK_WEBHOOK_SECRET`, needed for the Clerk→Neon user sync —
  see the item below) are registered for Development only; Production/Preview
  need the same before this iteration's routes will work once deployed for
  real.
- **New local users never sync to Neon under `vercel dev` (found same
  night, not a bug — a documented local-dev limitation):** the Clerk
  webhook (`api/webhooks/clerk.ts`) that creates a user's row in Neon can
  only be reached by Clerk at a public HTTPS URL, never at `localhost` — so
  a Clerk account only ever used locally has no corresponding `users` row,
  and any insert that references it (a new conversation, a task) fails its
  foreign key. Worked around for this session by fetching the user's email
  from Clerk's Backend API and inserting the `users`/`preferences` rows by
  hand to unblock local testing. Not something to "fix" in code — it's
  inherent to how webhooks work — but worth remembering for future
  iterations: a brand-new Clerk account only exercised through `vercel dev`
  will need this same manual step, or its webhook forwarded via a tool like
  the Clerk CLI/ngrok. In production this isn't an issue: Clerk can reach
  the real deployed webhook URL directly.
- **Tasks hierarchy + per-subtask timers + realistic time estimates
  (2026-08-19, mid-iteration-8 revision):** the flat Tasks checklist from the
  first pass of this iteration was reshaped into a two-level hierarchy after
  the user tried it: a **Task** (`tasks` table — title, description
  explaining what its subtasks are, priority, due date, nullable
  `conversationId` back to its source chat) grouping **Subtasks** (new
  `subtasks` table — title, `estimatedMinutes`, priority, due date,
  completed, and a real persisted timer:
  `timerStatus`/`remainingSeconds`/`timerEndAt`). This is a deliberate
  reversal of the original "no timer pressure, on purpose" design note from
  the first pass — the user explicitly asked for start/pause/±minutes on
  each subtask, so the flat "just a checklist label" `estimatedMinutes` is
  gone; the Task level still carries no timer of its own, only a rollup.
  - **Timer persistence, not client-only:** unlike the Timers tab's
    client-only `TimerInstance`, a subtask's timer state is written to the
    DB on every start/pause/±minutes action (never per-tick) so it survives
    a refresh or device switch — confirmed explicitly with the user over the
    simpler client-only alternative. The live countdown is still derived
    client-side every render tick from `timerEndAt` (mirrors
    `TimersTab.utils.ts`'s wall-clock technique), just sourced from a
    server-persisted timestamp instead of pure React state.
  - **Progress bar is all-or-nothing per subtask, weighted by minutes** —
    confirmed with the user over giving partial credit for an in-progress
    timer, specifically so subtracting time from a running subtask can't
    make the bar regress.
  - **"Go to chat" deep-links to the exact source conversation** (via the
    new `conversationId` FK, `onDelete: 'set null'`) rather than opening AI
    Chat generically — reverses the first pass's explicit choice not to keep
    that link ("traceability wasn't part of the ask ... revisit if asked
    later"). `useAiChatTab.ts` now reads `location.state.conversationId` on
    mount (consumed once via a ref) and calls the existing
    `selectConversation`.
  - **Manual add, two popups:** `AddTaskDialog` creates an empty Task
    (`steps: []`); `AddSubtaskDialog` (scoped to one task) adds a subtask to
    it — mirrors `AddTimerDialog`'s fully-controlled popup shape, each with
    its own small `useAddXDialog.ts` owning the draft state (title/
    description/priority/dueDate/minutes), reset every time it opens.
  - **New shared `PriorityControl`/`DueDateField` components**
    (`src/features/tasks/`) — a `ToggleButtonGroup` (low/medium/high, same
    pattern as the Timers/Dashboard preset selectors) and a native
    `<input type="date">` via MUI `TextField` (no `@mui/x-date-pickers` —
    same call the Dashboard tab already made), reused by both dialogs and
    the inline editors on `TaskCard`/`SubtaskRow` so priority/due date stay
    editable after creation, not just at creation time.
  - **API**: `POST /api/tasks` now creates one Task plus 0+ subtasks in a
    single batch (`steps: []` for the manual-add case, non-empty for an
    approved AI plan); `PATCH /api/tasks/[id]` edits the Task's own fields.
    Two new routes, `api/subtasks.ts` (create) and `api/subtasks/[id].ts`
    (PATCH/DELETE) — PATCH takes a single flexible body covering both plain
    field edits and a `timerAction` (`start`/`pause`/`addMinutes`/
    `subtractMinutes`), computed server-side from the row's current state.
    `api/` route-handler count is now 11 (added 2), still under Vercel
    Hobby's 12-Function cap flagged earlier in this file.
  - **`POST /api/chat-plan`'s response gained `taskTitle`/`taskDescription`**
    alongside `steps` — the model now also names and summarizes the overall
    task, shown as editable fields in `PlanPreviewCard` above the step list,
    and becomes the created Task's title/description on confirm. Priority/
    due date are deliberately NOT requested from the model (no real basis
    for either) — user-set only, after creation.
  - **Prompt rewrite for realistic time estimates:** the user's core
    complaint — the AI was estimating unrealistically short durations (e.g.
    "20 minutes to bathe a cat," which doesn't cover chasing/rinsing/
    drying/cleanup) — is addressed with string-only prompt changes, no
    schema/logic impact. `chat-plan.utils.ts`'s `buildPlanSystemPrompt` now
    explicitly asks for real-world durations including setup/cleanup/
    friction, and explicitly forbids shrinking estimates to fit a time
    budget mentioned earlier in the conversation. `chat.utils.ts`'s
    `buildSystemPrompt` (the live conversational persona) gained a
    parallel guideline: sanity-check a user-stated time budget against what
    the task actually needs, and if it's probably not enough, say so plainly
    (never scolding) and offer concrete options — do a smaller slice now,
    extend the time, or split across sessions — rather than silently
    proposing a plan that pretends to fit. This is the main lever for "help
    estimate when time does NOT reach," per the user's stated goal.
  - **Migration needs a human at a real terminal:** `drizzle-kit generate`
    prompts interactively to resolve whether the new `subtasks` table /
    `tasks` column changes are renames or genuinely new — it refused to run
    non-interactively (`Interactive prompts require a TTY terminal`). Schema
    changes are in `db/schema.ts`; run `npm run db:generate` then
    `npm run db:migrate` locally (interactive prompts: answer "created" /
    "no, add column" for each, not "renamed from") before testing this
    against a real database. Not run as part of this change for that reason.
  - **Deferred, not forgotten:** no `timerSessions`/Dashboard integration for
    subtask timers (would reopen the exact "no timer pressure" tension the
    original flat Tasks tab existed to avoid — kept as two separate timer
    surfaces); no auto-pause/notification when a subtask's timer hits 0 (just
    shows `0:00` and waits for the user).
- **AI Chat + Tasks tabs (iteration 8):** built alongside a reference app the
  user already had (`c:\CODE\2026\ai-chat-app`) — reused as a _pattern_
  source, not literal code: the SSE streaming shape (`res.write('data:
...\n\n')` server-side, a `response.body.getReader()` loop client-side) and
  the optimistic-update-with-rollback idea for the Tasks list. Everything
  else was rebuilt fresh for this project's stack (MUI + styled-components +
  the file-split convention vs. the reference's SCSS + hand-rolled
  components; Drizzle vs. raw SQL) — the reference had no system prompt and
  no structured/JSON-mode output at all, so the task-breakdown prompt and the
  plan-extraction mechanism are entirely new work.
  - **Groq via `groq-sdk`**, `openai/gpt-oss-120b` (see the existing "AI
    model" note below — unchanged). Two Groq call shapes: `/api/chat`
    streams a normal reply over SSE; a separate, explicit "Convert to plan"
    action (`/api/chat-plan`) makes a second, non-streaming call with
    `response_format: {type:'json_object'}` over the existing conversation
    history, returning `{steps:[{title,minutes}]}`. Kept these as two
    distinct actions rather than trying to detect "this looks like a plan"
    inside the streamed reply — explicit and predictable beats inferred,
    especially for an audience this app is built for.
  - **Conversations + messages persisted to Neon** (new `conversations` /
    `messages` tables) — the user asked for this explicitly rather than an
    ephemeral in-memory chat, so a conversation survives a refresh/reopen.
    Sidebar groups by `updatedAt` (Today/Yesterday/This week/Older), not
    `createdAt`, so a conversation you keep returning to stays near the top.
    Conversation title is derived deterministically from the first user
    message (trimmed/collapsed/truncated to 48 chars) rather than spending an
    extra Groq call just to name it.
  - **Accepted risk — no DB transaction around the chat write sequence:**
    the user message is written to Neon before calling Groq, and the
    assistant message is written after the stream completes; this project's
    `neon-http` Drizzle driver doesn't support `db.transaction()`, so a
    failure between those two writes (e.g. the process dying mid-stream)
    can leave an orphaned user message with no reply. Small window, low
    consequence (worst case: a dangling row, not corrupted data or a security
    issue) — documented in
    [docs/SECURITY.md](../docs/SECURITY.md#accepted-risks) alongside the
    existing `esbuild`/`drizzle-kit` entry rather than built around with
    retry/cleanup logic this iteration.
  - **The "send plan to Timers" pivot:** ROADMAP originally scoped the
    handoff as creating Timers-tab entries. Mid-iteration the user asked for
    a **new "Tasks" tab** instead — a flat, persisted checklist
    (`tasks` table: title, estimated minutes as a label only, completed
    boolean) with no timer attached and no "start a timer from this task"
    shortcut, specifically so working through an AI-built plan doesn't carry
    the pressure of a running countdown. This is the first change to the
    tab count since iteration 5 fixed it at three (when Settings moved to
    the header specifically to keep it there) — Tasks is the 4th tab, placed
    right after AI Chat (its source), with Dashboard staying last as the
    review tab. A plan is never persisted as its own entity; it's a
    transient, editable client-side draft (`PlanPreviewCard`) until the user
    confirms, at which point it becomes real `tasks` rows via
    `POST /api/tasks`. No link is kept from a task back to its source
    conversation — traceability wasn't part of the ask and was left out to
    keep scope minimal; revisit if asked later.
  - **Bug found while implementing:** a `useEffect` in `useAiChatTab.ts`
    keyed on the active conversation id was refetching+clearing `messages`
    on every id change, including the id change that happens right after
    `sendMessage` creates a brand-new conversation — which wiped the
    just-streamed assistant reply a moment after it arrived (a real
    flash/loss bug, not a test artifact). Fixed by removing that effect and
    replacing it with an explicit `loadConversationMessages(id)` call, guarded
    by a "latest requested id" ref (so a late-resolving fetch can't stomp
    newer state), invoked only from the user-driven "select a conversation"
    handler — `startNewChat()`/delete-confirm now clear `messages` directly
    themselves instead of relying on an effect to notice.
  - **Testing:** `@clerk/testing`'s official Playwright helper
    (`clerkSetup()`/`clerk.signIn()`) drives the one real sign-in the e2e
    flow needs; `/api/chat` and `/api/chat-plan` are mocked at the network
    layer (`page.route`) so the spec needs no `GROQ_API_KEY` and produces no
    Groq spend. The spec `test.skip()`s itself without a dedicated
    `E2E_CLERK_TEST_EMAIL`/`E2E_CLERK_TEST_PASSWORD` test-mode user (see
    `.env.example`) — not wired into CI this iteration, same deferral as
    the rate-limiting/CSP items already tracked for v0.10.0.
  - Added `react-markdown` + `remark-gfm` for assistant-message rendering
    (no syntax-highlighting package — this isn't a coding assistant) and
    `groq-sdk` for the API calls; pushed the bundle further, bumped
    `chunkSizeWarningLimit` again (same recurring note as prior iterations).
- **Dashboard tab (iteration 7):** chart library is `@mui/x-charts` (user's
  choice between it and Recharts — picked for inheriting the app's MUI theme
  automatically, so the charts use the same muted teal as the rest of the app
  with no separate color config). Ran the `dataviz` skill before writing any
  chart code, which changed the plan from the originally-sketched pie chart to
  two bar charts: per its "choosing a form" guidance, a pie/donut isn't the
  recommended form for part-to-whole (a stacked/plain bar is) and is flagged
  as an anti-pattern for comparing close values; and per its color-formula
  guidance, a single bar chart whose bars are different nominal categories
  (the four timer presets) is _one series_, so it takes one flat color
  (slot-1, here the app's own primary teal) rather than a distinct hue per
  bar — a categorical palette is for genuinely separate overlaid series, which
  this isn't. Two charts: a "time spent" bar chart bucketed over the selected
  range, and a "by type" horizontal bar chart ranking presets by total logged
  time (only presets with ≥1 session in range are shown). Date-range filter is
  four relative presets (7/30/90 days, all time) via the same
  `ToggleButtonGroup` pattern as the Timers tab's preset selector, not a
  free-form calendar picker — avoids pulling in `@mui/x-date-pickers` for a
  personal-tracking dashboard that doesn't need an arbitrary custom range.
  - **Time-series bucketing adapts to the range's span:** day buckets up to
    31 days, week buckets up to 180 days, month buckets beyond that — so "All
    time" doesn't render one bar per day and turn into unreadable clutter on
    a mobile-width chart. Every bucket in range is seeded with 0 before
    sessions are summed in, so a quiet day/week/month shows as a real gap
    rather than being silently omitted (which would compress the axis and
    misrepresent the gap as "doesn't exist").
  - **API change:** `GET /api/timer-sessions` now accepts optional
    `startDate`/`endDate` query params. Omitted (the Timers tab's own "recent
    history" call) keeps the exact original behavior — last 50 sessions,
    unfiltered. Given (the Dashboard's call) filters by `startedAt` and lifts
    the cap to 2000, since a wide "all time" range needs every session to
    aggregate correctly, not just the most recent ones — still a sanity
    ceiling against an unbounded query, not a product limit anyone doing
    personal timer tracking would realistically hit. Both bounds are required
    together; one without the other, or an unparsable date, is a 400.
  - **Refetch doesn't skeleton-flash:** switching the date-range preset keeps
    the previous range's numbers visible (dimmed via opacity, not unmounted)
    until the new ones land, rather than swapping to a spinner and causing a
    layout jump.
  - **Deferred, not forgotten:** a full per-chart accessible table-view twin
    (screen-reader/keyboard access to the exact same data the bars show) is
    left for iteration 9's dedicated WCAG pass rather than built per-chart
    here — consistent with how that iteration is already scoped as the
    project's accessibility gate. The Timers tab's existing session history
    list already gives non-visual access to the same underlying data in the
    meantime.
  - Pushed the main bundle from ~850kB to ~1.1MB raw (~340kB gzipped) —
    `@mui/x-charts` is the single heaviest addition since Clerk. Bumped
    `chunkSizeWarningLimit` again (same recurring note as v0.6.0/v0.7.0);
    real fix is still the code-splitting tracked for v0.10.0, called out
    there as the next tab specifically worth lazy-loading.
- **Timers tab (iteration 6):** presets (`short-break` 5m, `long-break` 15m) are
  quick-select defaults, not fixed values — every timer's duration is always
  further editable (composer or an idle card), see below. `pomodoro-focus`
  (Focus) is the exception: it's not a single duration at all, it opens a
  dedicated Pomodoro flow — see the "presets suggest predefined times again,
  plus a real Pomodoro" revision further down.
  Supports **multiple concurrent timers**: each one is a card (compact row, not a
  full-screen countdown) with an optional user-given name, added via a composer
  form at the top; one shared interval drives every running card's countdown so
  they can't drift relative to each other. Countdown correctness: each running timer tracks its
  own wall-clock end timestamp (not a decrementing counter) and re-derives the
  remaining time from it every tick, so a throttled/backgrounded tab can't drift
  either — it self-corrects instead of losing time. Stopping a timer that's
  running or paused (i.e. has real progress) asks for confirmation first
  (`StopTimerDialog`, mirrors `DeleteAccountDialog`'s pattern) since it can't be
  undone; an untouched idle card is removed immediately with no prompt, since
  there's nothing to lose. A confirmed manual stop logs the elapsed time as
  `completed: false`; letting the countdown reach zero auto-logs
  `completed: true` and fires the completion notification — stops under 5 elapsed
  seconds aren't logged at all and skip the confirmation entirely (near-certain
  mis-taps, not real sessions). An optional per-second tick sound (off by
  default, toggled via a header icon, preference kept in `localStorage` — a UI
  preference, not account data) is synthesized with the Web Audio API rather
  than shipping an audio asset; the shared `AudioContext` is created/resumed
  from user-gesture handlers specifically (toggling sound on, tapping a timer)
  since browsers refuse to unlock audio from a bare interval callback.
  Notifications prefer `ServiceWorkerRegistration.showNotification()` (works on
  mobile browsers that block the bare `Notification` constructor, and can still
  fire if the tab isn't focused) and fall back to `new Notification()` when no
  service worker registration is active yet (e.g. plain `npm run dev`); permission
  is requested on demand via a dismissible banner, not on page load. Layout is
  deliberately compact (small per-card play/pause + progress bar rows, no
  large fixed-height countdown circle) so the composer plus a handful of active
  timers fit one mobile screen without scrolling. Added `api/auth.utils.ts` to
  share the Clerk-token-verification helper that was previously private to
  `api/preferences.utils.ts`, now that a second authenticated route
  (`api/timer-sessions.ts`) needs the same check.
  - **Editable duration, explicit play control (revision after first pass):**
    tapping a card no longer starts it — that overloaded a single tap with two
    different meanings (edit vs. start) depending on state, which is exactly the
    kind of implicit, context-dependent interaction this app tries to avoid.
    Instead: an idle card shows its duration as an editable `MinutesInput`
    (typed directly, scrolled with the mouse wheel, or nudged with +/- buttons —
    `src/features/timers/MinutesInput/`, shared by the composer and every idle
    card) in place of the static time text, and a dedicated play/pause icon
    button starts/pauses it explicitly. Once running or paused, the duration
    locks in (shown as static text again) — editing a total mid-run is
    ambiguous enough (what happens to elapsed time if you shrink it below
    that?) that it's out of scope rather than guessed at; stop-and-restart
    covers that case for now. Preset buttons became quick-fill defaults for
    this field rather than fixed values — picking one just reseeds the
    duration, which stays freely editable afterward either way.
    - **Bug found writing this:** `useMinutesInput`'s "resync draft from the
      external value when not focused" effect was keyed on `[value, isFocused]`.
      Since `isFocused` flips on every commit (blur), that re-triggered the
      effect immediately after a commit, and because a controlled `value` prop
      only catches up once the parent re-renders, it could clobber the
      just-committed draft back to the stale prop for a tick. Fixed by tracking
      focus in a ref instead of state, so only an actual `value` change
      re-triggers the sync — the same "don't let an effect's own side effects
      feed back into its own dependencies" lesson as the interval/finishTimer
      pitfall above, in a different shape.
  - **"Add timer" popup (second revision):** the composer no longer shows a
    duration field inline — clicking "Add timer" was silently creating a timer
    with whatever the composer happened to be showing (25min, from the
    Focus preset selected by default), rather than making the user actively
    choose a duration. Now the button opens `AddTimerDialog`
    (`src/features/timers/AddTimerDialog/`), a small popup around the same
    `MinutesInput` used on idle cards, always reset to
    `DEFAULT_CUSTOM_MINUTES` (10) on open regardless of which preset button
    was last clicked — confirming there creates the timer, cancelling creates
    nothing. Preset buttons now only tag the resulting timer's translated
    display name (`selectPreset` no longer touches the duration at all); the
    duration is decided once, in the popup, and stays freely editable
    afterward on the idle card exactly as before.
  - **Pitfall worth remembering:** the running-timers interval effect must read
    `finishTimer` through a ref rather than depending on it directly — its
    identity depends on `getToken`/`t`, which aren't contractually stable
    references, and depending on it directly caused a real infinite render
    loop in testing (an unstable mock reproduced it immediately). The fix
    (ref-read inside the interval, skip `setState` entirely on ticks where
    nothing actually changed) is the safer default for any interval-driven
    effect that calls back into hook state.
  - **Presets suggest predefined times again, plus a real Pomodoro (third
    revision):** reverted the "always defaults to 10" popup behavior — Short
    break/Long break now prefill `AddTimerDialog` with their suggested minutes
    (5/15) again, still freely editable before confirming; Custom's button is
    relabeled "Custom time" to read as its own explicit choice rather than a
    leftover fourth option. Focus stopped being a single-duration preset
    entirely: selecting it and pressing "Add timer" opens a new
    `PomodoroDialog` (`src/features/timers/PomodoroDialog/`) instead, which
    explains the split ("This will be 20 min of focus followed by 10 min of
    break") and offers two `MinutesInput` fields — defaulting to 20/10, and
    editable right there rather than behind a separate "customize" toggle —
    before creating the timer. A Pomodoro timer carries a `phases` array
    (`[{kind:'focus',...}, {kind:'break',...}]`) plus a `phaseIndex`;
    `plannedSeconds`/`remainingSeconds` always mirror whichever phase is
    active, so every other card affordance (progress bar, `MinutesInput`
    while idle, the stop confirmation) keeps working unmodified. Once
    running, a focus phase completing auto-advances the same card straight
    into its break phase (no extra tap — friction between phases works
    against the whole point of the structure) with a distinct two-note
    "chime" (`playChimeSound`, Web Audio, separate from the ambient tick) and
    its own notification; the break completing then finishes the timer for
    real. Each phase logs its own history session as it completes
    (`presetId` resolves to `pomodoro-focus`/`short-break` depending on which
    phase was active — both already-valid ids, no server-side changes
    needed), so a manual stop only ever loses the _current_ phase's partial
    progress, not any earlier one. Per the user's ask ("no debe tener sonido
    excepto cuando termina"), a Pomodoro never plays the ambient per-second
    tick regardless of the sound preference — only the chime, at each phase
    boundary, unconditionally, since that's essential feedback for a
    structure the user can't otherwise track without watching the clock.
    - **Bug found writing this:** `advancePhaseOrFinish`'s phase-transition
      update went through `setTimers` directly, without syncing `timersRef`
      the way the tick loop's own countdown update already did. That's fine
      for a single transition (the assertion runs after the whole `act()`
      settles and React's own `timersRef.current = timers` effect has caught
      up) but broke a Pomodoro completing _two_ phases inside one fake-timer
      burst: the second completion read `timersRef` still holding the first
      phase's now-stale `endTimestampMs`, saw nothing new to compare against,
      and silently did nothing. Same family of bug as the two pitfalls
      above — fixed by routing every `timers` mutation through one
      `applyTimers` helper that updates `timersRef.current` synchronously,
      computed from the ref itself rather than React's own (possibly
      not-yet-flushed) `current` updater argument, before also calling
      `setTimers`.
  - **Name moved into the popup, plus "add minutes" mid-run (post-merge
    revision, branch `fix/timer-name-and-add-minutes`):** the free-text name
    field used to live in the always-visible composer, ahead of preset
    selection — now it's inside `AddTimerDialog`/`PomodoroDialog` themselves,
    right alongside the duration field(s) it's paired with conceptually.
    `nameDraft` (already existed, just relocated) resets to empty on
    `openAddDialog` now too, matching the existing duration-reset behavior,
    so a leftover name from a cancelled popup can't silently attach to the
    next timer. Separately, a running or paused card now has a small "add
    minutes" button next to its countdown (`ADD_MINUTES_STEP`, 5 min per tap
    — same default step as `MinutesInput`'s own +/- nudge) for when a task
    runs long and the timer shouldn't just end on it; pure logic lives in
    `addMinutesToTimerInstance` (`TimersTab.utils.ts`) — extends both
    `plannedSeconds` and `remainingSeconds` by the same delta (keeps the
    progress bar meaningful instead of jumping), nudges a running timer's
    wall-clock `endTimestampMs` out by the same amount, and, for a Pomodoro,
    extends its _current_ phase's seconds too. Idle timers are untouched —
    they already have `MinutesInput` for setting an exact duration.
- **Timers tab rethink, scoped (2026-08-19, pre-iteration-9 design pause):**
  the user paused before starting iteration 9 to think through why the Timers
  tab "doesn't do much" — not a bug fix, a product-direction decision. Root
  cause identified: since mid-iteration-8 gave every Subtask its own
  start/pause/±minutes countdown, Timers and Tasks now both let you run a
  countdown and nothing steers a user toward one over the other, making
  Timers feel redundant. This note is the spec for the iteration that
  addresses that — **design only, no code changed by this note itself.**
  - **Tasks is out of scope, deliberately.** An earlier draft of this note
    considered simplifying the Subtask mini-timer down to a plain progress
    marker, to remove the overlap from that side — the user rejected that;
    Tasks and its mini-timer are unchanged by this note and by the iteration
    it describes. See the "Tasks hierarchy + per-subtask timers" note above
    ("Deferred, not forgotten": kept as two separate timer surfaces on
    purpose) for the fuller history.
  - **Differentiation is conceptual, not a new mechanism.** Timers is
    positioned as the real structured-session tool (Pomodoro phases, sound,
    rich session history feeding the Dashboard); Tasks stays the
    lightweight persisted checklist with simple per-subtask progress
    tracking. What actually resolves the "redundant" feeling isn't a
    technical change to either tab — it's giving Timers a real entry point
    (see "Start a Pomodoro now" below) instead of requiring someone to think
    to open it on their own.
  - **Pomodoro becomes the default flow.** Today: `Add timer` → choose a
    preset among 4 → for Focus, a separate `PomodoroDialog`. Direction: the
    tab's primary/first CTA opens Pomodoro setup directly (focus/break
    minutes, still editable, same fields as today's `PomodoroDialog`); Short
    break / Long break / Custom remain reachable as a secondary, less
    prominent path rather than peers in the same button row. Rationale:
    fewer decisions before starting is more neurodivergent-friendly than
    four equally-weighted options, and Pomodoro's structure (forced breaks,
    auto-advancing phases) is the more supportive default for this audience
    than an undifferentiated countdown.
  - **Optional task/subtask link when starting a timer directly.** Covers
    using Timers on its own (not via chat): an optional "what are you
    working on?" picker (recent/active Tasks/Subtasks, or free text). Shape:
    a nullable reference (e.g. `taskId`/`subtaskId`) plus a snapshotted
    label string on `TimerInstance`/`TimerSession`, so history stays
    readable even if the source task is later edited/deleted. Surfaces in
    the active timer card, session history, and the Dashboard (group/filter
    by task). Explicitly not a button added _to_ a Task/Subtask — the link
    is offered from the Timers side only.
  - **"Start a Pomodoro now" in the chat plan preview.** `PlanPreviewCard`
    gains a second action next to the existing "Send to Tasks": confirming
    it does not call `POST /api/tasks` at all — it starts a Pomodoro session
    in the Timers tab (navigating there, mirroring the existing "go to
    chat" deep-link pattern but in the opposite direction), labeled with the
    plan's task title, using the first step's Pomodoro-shaped estimate (see
    below) to prefill focus/break minutes. This is the concrete answer to
    "chat should offer the idea of going to Timers too," and is what gives
    Timers a reason to exist distinct from Tasks: immediate structured work,
    no checklist-creation step first.
  - **Chat plan estimates become Pomodoro-shaped.** `chat-plan.utils.ts`'s
    `buildPlanSystemPrompt` should ask the model to express each step's
    duration as a suggested Pomodoro breakdown (focus block count + break
    pattern) rather than, or alongside, a raw minute count; `PlanPreviewCard`
    displays that shape per step, still editable before confirming either
    action. **Open question, not decided here:** whether the underlying
    stored `estimatedMinutes` on a Subtask stays the source of truth
    (Pomodoro phrasing computed for display only) or a structured breakdown
    gets stored — an implementation detail for whoever picks this up.
  - **Explicitly deferred / out of scope for this note:** any DB schema
    changes (belong to the implementation iteration, not this design pass);
    any change to the Tasks tab or its subtask mini-timer; merging the two
    timer engines; a button added to a Task/Subtask that launches a Timers
    session (the bridge only goes chat → Timers, per the decision above).
  - **Next step:** when `iteration/08b-timers-rethink` is picked up for
    real, follow the standard local-first workflow (branch, implement, user
    tries it locally, approve before push/merge) — this note is the spec to
    build from, not a finished implementation plan.
- **Timers tab rethink — implemented (2026-08-19, same day, branch
  `iteration/08b-timers-rethink`):** built the design above end to end. Tried
  locally and approved by the user the same day; pushed and merged into
  `main`.
  - **Pomodoro-as-default:** `TimersTab`'s composer now leads with a single
    full-width "Start a Pomodoro" button (`useTimersTab`'s new
    `openPomodoroDialog`, decoupled entirely from `selectedPresetId`) that
    opens `PomodoroDialog` directly. Short break/Long break/Custom moved
    into a collapsed-by-default "Other timer options" row
    (`isOtherTimersOpen`/`toggleOtherTimers`); `selectedPresetId`'s initial
    value moved off `pomodoro-focus` to `short-break` since Focus is no
    longer offered there. The old `openAddDialog` "select
    `pomodoro-focus` → routes to the Pomodoro dialog anyway" branch was kept
    as defense in depth rather than deleted, even though the secondary row
    can't produce that selection anymore.
  - **Optional task/subtask link:** new `timerSessions.taskId`/`subtaskId`/
    `taskLabel` columns (nullable, `onDelete: 'set null'`, migration
    `0004_glorious_zarek.sql` — generated and applied non-interactively this
    time, since these are new columns, not the rename-ambiguous case the
    earlier subtasks migration hit) plus matching fields on the client's
    `TimerInstance`/`TimerSession`. `POST /api/timer-sessions` verifies a
    given `taskId`/`subtaskId` actually belongs to the caller
    (`verifyTaskLinkOwnership`, same IDOR-safe pattern as
    `conversationBelongsToUser`) before writing it — a `subtaskId` without
    its parent `taskId`, or a `taskId` without a `taskLabel` snapshot, is
    rejected as malformed rather than silently accepted. New
    `TaskLinkPicker` component (plain MUI `Autocomplete`, **not** `freeSolo`
    — arbitrary free text is already covered by the existing Name field, so
    this stays a picker over real Tasks/Subtasks or nothing) appears in both
    `AddTimerDialog` and `PomodoroDialog` whenever `useTimersTab`'s
    `taskLinkOptions` is non-empty (fetched via the Tasks feature's own
    `fetchTasks`, cross-feature reuse — same convention as `PlanPreviewCard`
    already reusing `MinutesInput`). `TimersTab.utils.ts`'s
    `buildTaskLinkOptions` flattens Tasks into one option per Task (skipped
    entirely if every one of its Subtasks is already completed) plus one per
    incomplete Subtask, labeled "Task → Subtask". Linked sessions show their
    label on the active timer card and in session history.
  - **Chat → Timers bridge:** `PlanPreviewCard` gained a second action,
    "Start a Pomodoro now", next to "Send to Tasks" — `useAiChatTab`'s new
    `startPomodoroFromPlan` calls `navigate('/timers', { state: {
startPomodoro: {...} } })` with no `/api/tasks` call at all.
    `useTimersTab` consumes that router state once on mount
    (`consumedPomodoroPrefillRef`, the same one-shot-ref shape as
    `useAiChatTab`'s own `consumedDeepLinkConversationIdRef` "go to chat"
    handling, just in the opposite direction) and opens `PomodoroDialog`
    pre-filled from it.
  - **Chat plan estimates, Pomodoro-shaped — resolved the open question as
    display-only.** Rather than changing `buildPlanSystemPrompt`'s requested
    JSON shape (which would have touched the Groq schema, `chat-plan`'s
    validation, and `PlanStepDraft`/`Subtask.estimatedMinutes`), a step's
    existing `minutes` stays the sole source of truth end to end; a new pure
    helper, `estimatePomodoroBreakdown` (`AiChatTab.utils.ts`, reusing the
    Timers tab's own `DEFAULT_POMODORO_FOCUS_MINUTES`/`_BREAK_MINUTES`
    rather than duplicating them), derives a block count fresh on every
    render for display only ("~2 pomodoros (20 min focus + 10 min break)",
    under each step in `PlanPreviewCard`) and to prefill the "Start a
    Pomodoro now" bridge above. Smaller, no schema/prompt risk, and reversible
    later without a migration if a stored breakdown turns out to be wanted
    after all.
  - **Tests:** `useTimersTab.test.ts` needed a `MemoryRouter` wrapper
    (`renderTimersHook`, matching `useTasksTab.test.ts`'s own
    `renderTasksHook` — `useLocation` throws outside a Router) since the
    hook now reads router state; every Pomodoro-flow test that used to rely
    on `pomodoro-focus` being the default `selectedPresetId` was switched to
    call the new `openPomodoroDialog` directly. `TimersTab.test.tsx` likewise
    needed `MemoryRouter`, plus an `openOtherTimers` test helper that's a
    no-op if the secondary row is already open (its own toggle button would
    otherwise close it again on a second call within one test). New coverage:
    `buildTaskLinkOptions`, the task-link fields round-tripping through
    `parseCreateTimerSessionBody`, and `estimatePomodoroBreakdown`.
  - **Not done in this pass, left for whoever merges it:** no new Playwright
    e2e spec for the chat → Timers bridge specifically (the existing
    `chat-to-tasks.spec.ts` still only covers "Send to Tasks"); `npm audit`
    not re-run since no dependency changed (`TaskLinkPicker` uses
    `@mui/material`'s existing `Autocomplete`, already a dependency).
- **Task roulette (iteration 17):** depends on the gamification system from
  iteration 10 (points/badges) and the Timers tab from iteration 6 (the task list
  it spins over) already being in place — it's an extension/consumer of both, not
  a standalone feature, which is why it sits after them despite the user
  originally suggesting "v1.3.0" (already taken by the relaxation tab). Suggested
  package `react-custom-roulette`: zero runtime dependencies, MIT — good for a
  decorative UI piece — but its last publish was over a year ago as of this
  writing (Aug 2026), so re-check it's still the best option (not abandoned, no
  newer alternative) when this iteration actually starts.
- **Header + 3-tab nav (iteration 5, mid-course UI change):** added a fixed header
  (`src/app/Header`) with the app logo/name, always rendered — above the sign-in
  screen too, not just the signed-in app. Settings moved out of the bottom nav into
  the header (avatar + gear icon) since it's an account-level concern, not a core
  feature tab; the bottom nav is 3 tabs now (Timers, AI Chat, Dashboard), not 4.
  `/settings` is still a real route, just reached differently. Extracted
  `useClerkAppearanceVariables` (`src/theme/`) so the Clerk-theming object (used by
  SignIn, and now both UserButton instances) isn't hand-copied per component.
  - **Avatar + gear unified into one control (2026-08-19, small standalone fix,
    same session as the Timers rethink above but unrelated to it — done on the
    same branch since nothing had been committed yet; flag if it should be its
    own branch instead):** the user found the avatar-plus-separate-gear-icon
    pairing confusing — two adjacent controls that read as peers but opened
    genuinely different things (Clerk's own profile/account menu vs. this
    app's own Settings page). Fix: the gear `IconButton` is gone; `<UserButton>`
    now renders a custom `<UserButton.MenuItems>` item (`<UserButton.Action>`,
    not `<UserButton.Link>`, specifically so clicking it calls
    `useHeader`'s `goToSettings` — a real React Router `navigate('/settings')` —
    instead of an `href` navigation, which would have full-page-reloaded since
    `ClerkProvider` isn't configured with `routerPush`/`routerReplace` here).
    `useHeader.ts` lost `isSettingsActive` along with it — a color-highlighted
    gear made sense as an always-visible icon, but has no equivalent once
    Settings is a menu item that's only visible while the dropdown is open.
    Settings' own explicit "Sign out"/"Delete account" buttons are untouched
    (see the Settings tab note below) — only the entry point into the Settings
    _page_ moved, not anything on it.
- **Settings tab (iteration 5):** profile/account management delegated to Clerk's
  `<UserButton>` (themed with our design tokens) instead of hand-building
  name/avatar/email editing — same reasoning as using `<SignIn>` in iteration 3:
  password/email-change flows have real security implications better left to
  Clerk's tested UI. Kept our own explicit "Sign out" and "Delete account" buttons
  outside that menu rather than relying on Clerk's embedded versions, since an
  always-visible, plainly-labeled action is more predictable than one buried a
  click deep in a dropdown — matters for this app's audience. Delete account
  (`user.delete()`) needed no special Clerk Dashboard toggle — verified end-to-end
  by actually deleting a real test account. Wired `@clerk/localizations`
  (`en-US`/`es-ES` subpath imports, not the barrel — same size either way since
  tree-shaking already dropped unused locales, but subpaths are more explicit) so
  Clerk's own UI (sign-in, account menu) follows the app's language instead of
  staying stuck in English — verified Clerk's UI genuinely switches to Spanish.
  Costs ~170kB raw / ~43kB gzipped for both locales combined; bumped
  `chunkSizeWarningLimit` again, same v0.10.0 code-splitting note as before.
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
- **Vercel build failing on every `/api`/`/db` file (found post-v0.8.0 merge,
  fixed on branch `fix/vercel-esm-import-extensions`):** `tsc -b` passes clean
  locally, but Vercel's own build kept failing with `TS2307` ("Cannot find
  module") and `TS2835` ("Relative import paths need explicit file extensions
  ... when '--moduleResolution' is 'node16' or 'nodenext'") across
  `preferences.ts`, `timer-sessions.ts`, `timer-sessions.utils.ts`, and their
  test files. Root cause: `tsconfig.api.json` sets
  `"moduleResolution": "bundler"` (matching how Vite bundles `src/`, so
  extensionless relative imports resolve fine there), but Vercel's own
  per-function build step for `/api` doesn't honor that — with
  `"type": "module"` in `package.json`, it resolves each function under
  Node's real ESM rules (`node16`/`nodenext`), which require the literal
  `.js` extension on a relative import even though the source file is `.ts`
  (TypeScript's own documented convention for this mode — the import
  specifier names the compiled output, not the source file). Fixed by adding
  `.js` to every relative import across `api/` and `db/` (`./foo` →
  `./foo.js`); `tsc -b`'s own `bundler` resolution accepts a `.js` specifier
  pointing at a same-named `.ts` file without complaint, so this satisfies
  both build paths at once. `src/` is unaffected — Vite's bundler resolution
  there was never the problem. Verified locally (typecheck/lint/test/build
  all clean); the real confirmation is Vercel's next build.
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
- **Relaxation animations (iteration 16):** open to a library here, not committed to
  hand-rolling it — candidates to evaluate when this iteration starts:
  - **`motion`** (formerly `framer-motion`) — the most mature option, great for
    orchestrated phase sequences (inhale → hold → exhale → hold), huge
    community/maintenance track record. Heaviest of the options (~50-60kB gzip).
  - **`@react-spring/web`** — physics-based, also well-established, similar weight
    to `motion`.
  - **`lottie-react`** — if we'd rather use a pre-made, designer-quality animation
    (there are free breathing-exercise Lottie files available) than build the
    shape ourselves; different tradeoff (asset weight/quality vs. code control).
  - Plain CSS/`styled-components` keyframes (zero dependency) is still fine for
    something as simple as a circle expanding/contracting — genuinely don't need a
    library for that specific shape, just noting it's an option, not the mandate.
  - Whichever it is, lazy-load it (`import()`) so it doesn't add to everyone's
    initial bundle for a tab most sessions won't open — same spirit as the
    code-splitting already tracked for v0.10.0.
  - Must respect the `prefers-reduced-motion` handling already added in iteration 2
    (`src/index.css`) — for users with that preference, replace the moving shape
    with a static one plus a text/number countdown instead of skipping the
    exercise content entirely.
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
  the practical "free" choice for this feature. The base for how the chat could work could be taken from this github project, with a currently functional AI chat: https://github.com/alhanampi/AI-chat-app
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
