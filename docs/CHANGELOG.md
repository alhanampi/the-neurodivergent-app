# Changelog

Iteration-by-iteration build history: bugs found and fixed, design revisions made
mid-iteration, and the reasoning behind them. This is reference material, not
part of the standard per-session context — `CLAUDE.md` only requires reading
`ROADMAP.md` every session, not this file. Consult it when picking up work on a
tab/feature this history touches, debugging something that smells like a past
issue, or writing a new entry for the current iteration.

Newest first within no strict ordering guarantee beyond "grouped by what it's about."

---

## Production incident: Vercel 12-Function limit, `api/_lib/` fix

Found overnight during iteration 8, fixed on `main` and iteration 8 together.
While testing iteration 8 locally, discovered `main`'s last 3 production deploys
(in the ~20h before this was found) had all been silently failing with
`exceeded_serverless_functions_per_deployment` — Vercel's Hobby plan caps a
deployment at 12 Serverless Functions, and Vercel's zero-config `/api` convention
counts _every_ file directly under `api/` (not just route handlers) as its own
Function. This project's file-split convention (CLAUDE.md) gives every route 2-4
sibling files (`.utils.ts`, `.interfaces.ts`, `.constants.ts`), so `main` alone
was already at 11 files before this iteration added anything — the first deploy
that pushed past that (a routine merge, nothing unusual about it) started failing
with no visible signal short of checking deploy status by hand. Iteration 8 alone
would have added ~19 more files, making this impossible to ignore.

Fix: moved every non-handler file into `api/_lib/` (Vercel excludes
underscore-prefixed paths from Function detection), leaving only genuine route
handlers directly under `api/` — 9 total after this iteration, comfortably under
the cap. See [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for the folder layout and
the full explanation; every relative import across `api/` was mechanically
rewritten to match (verified via `typecheck`/`lint`/`test`/`build`, all clean).
Also found and fixed while chasing this: `vite.config.ts`'s Vitest `test` block
had no `exclude` for `e2e/`, so Vitest tried (and failed) to execute the new
Playwright spec as one of its own tests — added
`exclude: ['**/node_modules/**', '**/dist/**', './e2e/**']`.

This needed to reach `main`/production on its own (independent of whether
iteration 8 shipped yet) since production was down until it did — flagged to the
user as soon as found rather than silently worked around.

## Local-only Clerk/Groq keys never reached Vercel

Found the same night as the incident above. `CLERK_SECRET_KEY`, `GROQ_API_KEY`,
and `VITE_CLERK_PUBLISHABLE_KEY` had only ever been added to `.env.local` by
hand, never registered on the Vercel project itself — `vercel dev` builds a
function's runtime env from Vercel Cloud's registered variables (matching the
target environment), not from arbitrary local-only additions to `.env.local`, so
every authenticated route 401'd locally regardless of a valid session. Fixed by
`vercel env add` for the Development environment.

**This was still open as of the timers-rethink iteration (v0.9.5):** these three
(plus `CLERK_WEBHOOK_SECRET`, needed for the Clerk→Neon user sync) were
registered for Development only — see `ROADMAP.md`'s open-items list for current
status on Production/Preview.

## New local users never sync to Neon under `vercel dev`

Found the same night — not a bug, a documented local-dev limitation. The Clerk
webhook (`api/webhooks/clerk.ts`) that creates a user's row in Neon can only be
reached by Clerk at a public HTTPS URL, never at `localhost` — so a Clerk account
only ever used locally has no corresponding `users` row, and any insert that
references it (a new conversation, a task) fails its foreign key. Worked around
for that session by fetching the user's email from Clerk's Backend API and
inserting the `users`/`preferences` rows by hand to unblock local testing. Not
something to "fix" in code — it's inherent to how webhooks work — but a brand-new
Clerk account only exercised through `vercel dev` will need this same manual
step, or its webhook forwarded via a tool like the Clerk CLI/ngrok. In production
this isn't an issue: Clerk can reach the real deployed webhook URL directly. See
also [docs/ARCHITECTURE.md](./ARCHITECTURE.md#local-dev-gotchas).

## Tasks hierarchy + per-subtask timers + realistic time estimates

2026-08-19, mid-iteration-8 revision. The flat Tasks checklist from the first
pass of this iteration was reshaped into a two-level hierarchy after the user
tried it: a **Task** (`tasks` table — title, description explaining what its
subtasks are, priority, due date, nullable `conversationId` back to its source
chat) grouping **Subtasks** (new `subtasks` table — title, `estimatedMinutes`,
priority, due date, completed, and a real persisted timer:
`timerStatus`/`remainingSeconds`/`timerEndAt`). This is a deliberate reversal of
the original "no timer pressure, on purpose" design note from the first pass —
the user explicitly asked for start/pause/±minutes on each subtask, so the flat
"just a checklist label" `estimatedMinutes` is gone; the Task level still carries
no timer of its own, only a rollup.

- **Timer persistence, not client-only:** unlike the Timers tab's client-only
  `TimerInstance`, a subtask's timer state is written to the DB on every
  start/pause/±minutes action (never per-tick) so it survives a refresh or
  device switch — confirmed explicitly with the user over the simpler
  client-only alternative. The live countdown is still derived client-side every
  render tick from `timerEndAt` (mirrors `TimersTab.utils.ts`'s wall-clock
  technique), just sourced from a server-persisted timestamp instead of pure
  React state.
- **Progress bar is all-or-nothing per subtask, weighted by minutes** —
  confirmed with the user over giving partial credit for an in-progress timer,
  specifically so subtracting time from a running subtask can't make the bar
  regress.
- **"Go to chat" deep-links to the exact source conversation** (via the new
  `conversationId` FK, `onDelete: 'set null'`) rather than opening AI Chat
  generically — reverses the first pass's explicit choice not to keep that link
  ("traceability wasn't part of the ask ... revisit if asked later").
  `useAiChatTab.ts` now reads `location.state.conversationId` on mount (consumed
  once via a ref) and calls the existing `selectConversation`.
- **Manual add, two popups:** `AddTaskDialog` creates an empty Task
  (`steps: []`); `AddSubtaskDialog` (scoped to one task) adds a subtask to it —
  mirrors `AddTimerDialog`'s fully-controlled popup shape, each with its own
  small `useAddXDialog.ts` owning the draft state (title/description/priority/
  dueDate/minutes), reset every time it opens.
- **New shared `PriorityControl`/`DueDateField` components**
  (`src/features/tasks/`) — a `ToggleButtonGroup` (low/medium/high, same pattern
  as the Timers/Dashboard preset selectors) and a native `<input type="date">`
  via MUI `TextField` (no `@mui/x-date-pickers` — same call the Dashboard tab
  already made), reused by both dialogs and the inline editors on
  `TaskCard`/`SubtaskRow` so priority/due date stay editable after creation, not
  just at creation time.
- **API**: `POST /api/tasks` now creates one Task plus 0+ subtasks in a single
  batch (`steps: []` for the manual-add case, non-empty for an approved AI
  plan); `PATCH /api/tasks/[id]` edits the Task's own fields. Two new routes,
  `api/subtasks.ts` (create) and `api/subtasks/[id].ts` (PATCH/DELETE) — PATCH
  takes a single flexible body covering both plain field edits and a
  `timerAction` (`start`/`pause`/`addMinutes`/`subtractMinutes`), computed
  server-side from the row's current state. `api/` route-handler count is now
  11 (added 2), still under Vercel Hobby's 12-Function cap.
- **`POST /api/chat-plan`'s response gained `taskTitle`/`taskDescription`**
  alongside `steps` — the model now also names and summarizes the overall task,
  shown as editable fields in `PlanPreviewCard` above the step list, and becomes
  the created Task's title/description on confirm. Priority/due date are
  deliberately NOT requested from the model (no real basis for either) —
  user-set only, after creation.
- **Prompt rewrite for realistic time estimates:** the user's core complaint —
  the AI was estimating unrealistically short durations (e.g. "20 minutes to
  bathe a cat," which doesn't cover chasing/rinsing/drying/cleanup) — is
  addressed with string-only prompt changes, no schema/logic impact.
  `chat-plan.utils.ts`'s `buildPlanSystemPrompt` now explicitly asks for
  real-world durations including setup/cleanup/friction, and explicitly forbids
  shrinking estimates to fit a time budget mentioned earlier in the
  conversation. `chat.utils.ts`'s `buildSystemPrompt` (the live conversational
  persona) gained a parallel guideline: sanity-check a user-stated time budget
  against what the task actually needs, and if it's probably not enough, say so
  plainly (never scolding) and offer concrete options — do a smaller slice now,
  extend the time, or split across sessions — rather than silently proposing a
  plan that pretends to fit.
- **Migration needs a human at a real terminal:** `drizzle-kit generate` prompts
  interactively to resolve whether the new `subtasks` table / `tasks` column
  changes are renames or genuinely new — it refused to run non-interactively
  (`Interactive prompts require a TTY terminal`). Schema changes are in
  `db/schema.ts`; run `npm run db:generate` then `npm run db:migrate` locally
  (interactive prompts: answer "created" / "no, add column" for each, not
  "renamed from") before testing against a real database.
- **Deferred, not forgotten:** no `timerSessions`/Dashboard integration for
  subtask timers (would reopen the exact "no timer pressure" tension the
  original flat Tasks tab existed to avoid — kept as two separate timer
  surfaces); no auto-pause/notification when a subtask's timer hits 0 (just
  shows `0:00` and waits for the user).

## AI Chat + Tasks tabs (iteration 8)

Built alongside a reference app the user already had
(`c:\CODE\2026\ai-chat-app`) — reused as a _pattern_ source, not literal code:
the SSE streaming shape (`res.write('data: ...\n\n')` server-side, a
`response.body.getReader()` loop client-side) and the
optimistic-update-with-rollback idea for the Tasks list. Everything else was
rebuilt fresh for this project's stack (MUI + styled-components + the file-split
convention vs. the reference's SCSS + hand-rolled components; Drizzle vs. raw
SQL) — the reference had no system prompt and no structured/JSON-mode output at
all, so the task-breakdown prompt and the plan-extraction mechanism are entirely
new work.

- **Groq via `groq-sdk`**, `openai/gpt-oss-120b` (see `ARCHITECTURE.md`'s "Key
  technical decisions" for the model choice reasoning). Two Groq call shapes:
  `/api/chat` streams a normal reply over SSE; a separate, explicit "Convert to
  plan" action (`/api/chat-plan`) makes a second, non-streaming call with
  `response_format: {type:'json_object'}` over the existing conversation
  history, returning `{steps:[{title,minutes}]}`. Kept these as two distinct
  actions rather than trying to detect "this looks like a plan" inside the
  streamed reply — explicit and predictable beats inferred, especially for an
  audience this app is built for.
- **Conversations + messages persisted to Neon** (new `conversations` /
  `messages` tables) — the user asked for this explicitly rather than an
  ephemeral in-memory chat, so a conversation survives a refresh/reopen.
  Sidebar groups by `updatedAt` (Today/Yesterday/This week/Older), not
  `createdAt`, so a conversation you keep returning to stays near the top.
  Conversation title is derived deterministically from the first user message
  (trimmed/collapsed/truncated to 48 chars) rather than spending an extra Groq
  call just to name it.
- **Accepted risk — no DB transaction around the chat write sequence:** the
  user message is written to Neon before calling Groq, and the assistant
  message is written after the stream completes; this project's `neon-http`
  Drizzle driver doesn't support `db.transaction()`, so a failure between those
  two writes (e.g. the process dying mid-stream) can leave an orphaned user
  message with no reply. Small window, low consequence (worst case: a dangling
  row, not corrupted data or a security issue) — documented in
  [docs/SECURITY.md](./SECURITY.md#accepted-risks) alongside the existing
  `esbuild`/`drizzle-kit` entry rather than built around with retry/cleanup
  logic this iteration.
- **The "send plan to Timers" pivot:** ROADMAP originally scoped the handoff as
  creating Timers-tab entries. Mid-iteration the user asked for a **new "Tasks"
  tab** instead — a flat, persisted checklist (`tasks` table: title, estimated
  minutes as a label only, completed boolean) with no timer attached and no
  "start a timer from this task" shortcut, specifically so working through an
  AI-built plan doesn't carry the pressure of a running countdown. This was the
  first change to the tab count since iteration 5 fixed it at three (when
  Settings moved to the header specifically to keep it there) — Tasks became
  the 4th tab, placed right after AI Chat (its source), with Dashboard staying
  last as the review tab. A plan is never persisted as its own entity; it's a
  transient, editable client-side draft (`PlanPreviewCard`) until the user
  confirms, at which point it becomes real `tasks` rows via `POST /api/tasks`.
- **Bug found while implementing:** a `useEffect` in `useAiChatTab.ts` keyed on
  the active conversation id was refetching+clearing `messages` on every id
  change, including the id change that happens right after `sendMessage`
  creates a brand-new conversation — which wiped the just-streamed assistant
  reply a moment after it arrived (a real flash/loss bug, not a test artifact).
  Fixed by removing that effect and replacing it with an explicit
  `loadConversationMessages(id)` call, guarded by a "latest requested id" ref
  (so a late-resolving fetch can't stomp newer state), invoked only from the
  user-driven "select a conversation" handler — `startNewChat()`/delete-confirm
  now clear `messages` directly themselves instead of relying on an effect to
  notice.
- **Testing:** `@clerk/testing`'s official Playwright helper
  (`clerkSetup()`/`clerk.signIn()`) drives the one real sign-in the e2e flow
  needs; `/api/chat` and `/api/chat-plan` are mocked at the network layer
  (`page.route`) so the spec needs no `GROQ_API_KEY` and produces no Groq spend.
  The spec `test.skip()`s itself without a dedicated
  `E2E_CLERK_TEST_EMAIL`/`E2E_CLERK_TEST_PASSWORD` test-mode user (see
  `.env.example`) — not wired into CI this iteration.
- Added `react-markdown` + `remark-gfm` for assistant-message rendering (no
  syntax-highlighting package — this isn't a coding assistant) and `groq-sdk`
  for the API calls; pushed the bundle further, bumped `chunkSizeWarningLimit`
  again.

## Dashboard tab (iteration 7)

Chart library is `@mui/x-charts` (user's choice between it and Recharts — picked
for inheriting the app's MUI theme automatically, so the charts use the same
muted teal as the rest of the app with no separate color config). Ran the
`dataviz` skill before writing any chart code, which changed the plan from the
originally-sketched pie chart to two bar charts: per its "choosing a form"
guidance, a pie/donut isn't the recommended form for part-to-whole (a
stacked/plain bar is) and is flagged as an anti-pattern for comparing close
values; and per its color-formula guidance, a single bar chart whose bars are
different nominal categories (the four timer presets) is _one series_, so it
takes one flat color (slot-1, here the app's own primary teal) rather than a
distinct hue per bar. Two charts: a "time spent" bar chart bucketed over the
selected range, and a "by type" horizontal bar chart ranking presets by total
logged time (only presets with ≥1 session in range are shown). Date-range filter
is four relative presets (7/30/90 days, all time) via the same
`ToggleButtonGroup` pattern as the Timers tab's preset selector, not a
free-form calendar picker.

- **Time-series bucketing adapts to the range's span:** day buckets up to 31
  days, week buckets up to 180 days, month buckets beyond that — so "All time"
  doesn't render one bar per day and turn into unreadable clutter on a
  mobile-width chart. Every bucket in range is seeded with 0 before sessions
  are summed in, so a quiet day/week/month shows as a real gap rather than
  being silently omitted.
- **API change:** `GET /api/timer-sessions` now accepts optional
  `startDate`/`endDate` query params. Omitted (the Timers tab's own "recent
  history" call) keeps the exact original behavior — last 50 sessions,
  unfiltered. Given (the Dashboard's call) filters by `startedAt` and lifts the
  cap to 2000. Both bounds are required together; one without the other, or an
  unparsable date, is a 400.
- **Refetch doesn't skeleton-flash:** switching the date-range preset keeps the
  previous range's numbers visible (dimmed via opacity, not unmounted) until the
  new ones land, rather than swapping to a spinner and causing a layout jump.
- **Deferred, not forgotten:** a full per-chart accessible table-view twin
  (screen-reader/keyboard access to the exact same data the bars show) is left
  for iteration 9's dedicated WCAG pass rather than built per-chart here. The
  Timers tab's existing session history list already gives non-visual access to
  the same underlying data in the meantime.
- Pushed the main bundle from ~850kB to ~1.1MB raw (~340kB gzipped) —
  `@mui/x-charts` is the single heaviest addition since Clerk. Bumped
  `chunkSizeWarningLimit` again; real fix is still the code-splitting tracked
  for v0.10.0.

## Timers tab (iteration 6)

Presets (`short-break` 5m, `long-break` 15m) are quick-select defaults, not
fixed values — every timer's duration is always further editable (composer or
an idle card). `pomodoro-focus` (Focus) is the exception: it's not a single
duration at all, it opens a dedicated Pomodoro flow — see the "presets suggest
predefined times again, plus a real Pomodoro" revision further down.

Supports **multiple concurrent timers**: each one is a card (compact row, not a
full-screen countdown) with an optional user-given name, added via a composer
form at the top; one shared interval drives every running card's countdown so
they can't drift relative to each other. Countdown correctness: each running
timer tracks its own wall-clock end timestamp (not a decrementing counter) and
re-derives the remaining time from it every tick, so a throttled/backgrounded
tab can't drift either. Stopping a timer that's running or paused (i.e. has real
progress) asks for confirmation first (`StopTimerDialog`, mirrors
`DeleteAccountDialog`'s pattern); an untouched idle card is removed immediately
with no prompt. A confirmed manual stop logs the elapsed time as
`completed: false`; letting the countdown reach zero auto-logs
`completed: true` and fires the completion notification — stops under 5 elapsed
seconds aren't logged at all and skip the confirmation entirely. An optional
per-second tick sound (off by default, toggled via a header icon, preference
kept in `localStorage`) is synthesized with the Web Audio API rather than
shipping an audio asset; the shared `AudioContext` is created/resumed from
user-gesture handlers specifically since browsers refuse to unlock audio from a
bare interval callback. Notifications prefer
`ServiceWorkerRegistration.showNotification()` and fall back to
`new Notification()` when no service worker registration is active yet (e.g.
plain `npm run dev`); permission is requested on demand via a dismissible
banner, not on page load. Added `api/auth.utils.ts` to share the
Clerk-token-verification helper that was previously private to
`api/preferences.utils.ts`, now that a second authenticated route
(`api/timer-sessions.ts`) needs the same check.

- **Editable duration, explicit play control (revision after first pass):**
  tapping a card no longer starts it — that overloaded a single tap with two
  different meanings (edit vs. start) depending on state. Instead: an idle card
  shows its duration as an editable `MinutesInput` (typed directly, scrolled
  with the mouse wheel, or nudged with +/- buttons —
  `src/features/timers/MinutesInput/`, shared by the composer and every idle
  card) in place of the static time text, and a dedicated play/pause icon
  button starts/pauses it explicitly. Once running or paused, the duration
  locks in (shown as static text again) — editing a total mid-run is out of
  scope; stop-and-restart covers that case for now. Preset buttons became
  quick-fill defaults for this field rather than fixed values.
  - **Bug found writing this:** `useMinutesInput`'s "resync draft from the
    external value when not focused" effect was keyed on `[value, isFocused]`.
    Since `isFocused` flips on every commit (blur), that re-triggered the
    effect immediately after a commit, and because a controlled `value` prop
    only catches up once the parent re-renders, it could clobber the
    just-committed draft back to the stale prop for a tick. Fixed by tracking
    focus in a ref instead of state, so only an actual `value` change
    re-triggers the sync — the same "don't let an effect's own side effects
    feed back into its own dependencies" lesson as the interval/finishTimer
    pitfall below, in a different shape.
- **"Add timer" popup (second revision):** the composer no longer shows a
  duration field inline — clicking "Add timer" was silently creating a timer
  with whatever the composer happened to be showing (25min, from the Focus
  preset selected by default), rather than making the user actively choose a
  duration. Now the button opens `AddTimerDialog`
  (`src/features/timers/AddTimerDialog/`), a small popup around the same
  `MinutesInput` used on idle cards, always reset to `DEFAULT_CUSTOM_MINUTES`
  (10) on open regardless of which preset button was last clicked — confirming
  there creates the timer, cancelling creates nothing. Preset buttons now only
  tag the resulting timer's translated display name (`selectPreset` no longer
  touches the duration at all).
- **Pitfall worth remembering:** the running-timers interval effect must read
  `finishTimer` through a ref rather than depending on it directly — its
  identity depends on `getToken`/`t`, which aren't contractually stable
  references, and depending on it directly caused a real infinite render loop
  in testing (an unstable mock reproduced it immediately). The fix (ref-read
  inside the interval, skip `setState` entirely on ticks where nothing actually
  changed) is the safer default for any interval-driven effect that calls back
  into hook state.
- **Presets suggest predefined times again, plus a real Pomodoro (third
  revision):** reverted the "always defaults to 10" popup behavior — Short
  break/Long break now prefill `AddTimerDialog` with their suggested minutes
  (5/15) again, still freely editable before confirming; Custom's button is
  relabeled "Custom time." Focus stopped being a single-duration preset
  entirely: selecting it and pressing "Add timer" opens a new `PomodoroDialog`
  (`src/features/timers/PomodoroDialog/`) instead, which explains the split
  ("This will be 20 min of focus followed by 10 min of break") and offers two
  `MinutesInput` fields — defaulting to 20/10, editable right there — before
  creating the timer. A Pomodoro timer carries a `phases` array
  (`[{kind:'focus',...}, {kind:'break',...}]`) plus a `phaseIndex`;
  `plannedSeconds`/`remainingSeconds` always mirror whichever phase is active.
  Once running, a focus phase completing auto-advances the same card straight
  into its break phase with a distinct two-note "chime" (`playChimeSound`, Web
  Audio, separate from the ambient tick) and its own notification; the break
  completing then finishes the timer for real. Each phase logs its own history
  session as it completes. Per the user's ask ("no debe tener sonido excepto
  cuando termina"), a Pomodoro never plays the ambient per-second tick
  regardless of the sound preference — only the chime, at each phase boundary.
  - **Bug found writing this:** `advancePhaseOrFinish`'s phase-transition
    update went through `setTimers` directly, without syncing `timersRef` the
    way the tick loop's own countdown update already did. That broke a
    Pomodoro completing _two_ phases inside one fake-timer burst: the second
    completion read `timersRef` still holding the first phase's now-stale
    `endTimestampMs`, saw nothing new to compare against, and silently did
    nothing. Fixed by routing every `timers` mutation through one
    `applyTimers` helper that updates `timersRef.current` synchronously,
    computed from the ref itself, before also calling `setTimers`.
- **Name moved into the popup, plus "add minutes" mid-run (post-merge
  revision, branch `fix/timer-name-and-add-minutes`):** the free-text name
  field used to live in the always-visible composer — now it's inside
  `AddTimerDialog`/`PomodoroDialog` themselves, alongside the duration field(s)
  it's paired with. `nameDraft` resets to empty on `openAddDialog` now too.
  Separately, a running or paused card now has a small "add minutes" button
  next to its countdown (`ADD_MINUTES_STEP`, 5 min per tap) for when a task
  runs long. Pure logic lives in `addMinutesToTimerInstance`
  (`TimersTab.utils.ts`) — extends both `plannedSeconds` and `remainingSeconds`
  by the same delta, nudges a running timer's wall-clock `endTimestampMs` out
  by the same amount, and, for a Pomodoro, extends its _current_ phase's
  seconds too.

## Timers tab rethink — design spec

2026-08-19, pre-iteration-9 design pause. The user paused before starting
iteration 9 to think through why the Timers tab "doesn't do much" — not a bug
fix, a product-direction decision. Root cause identified: since mid-iteration-8
gave every Subtask its own start/pause/±minutes countdown, Timers and Tasks now
both let you run a countdown and nothing steers a user toward one over the
other, making Timers feel redundant.

- **Tasks was out of scope, deliberately.** An earlier draft considered
  simplifying the Subtask mini-timer down to a plain progress marker, to remove
  the overlap from that side — the user rejected that; Tasks and its
  mini-timer stayed unchanged.
- **Differentiation is conceptual, not a new mechanism.** Timers positioned as
  the real structured-session tool (Pomodoro phases, sound, rich session
  history feeding the Dashboard); Tasks stays the lightweight persisted
  checklist with simple per-subtask progress tracking. What resolves the
  "redundant" feeling isn't a technical change to either tab — it's giving
  Timers a real entry point instead of requiring someone to think to open it on
  their own.
- **Pomodoro becomes the default flow.** The tab's primary/first CTA opens
  Pomodoro setup directly; Short break/Long break/Custom become a secondary,
  less prominent path.
- **Optional task/subtask link when starting a timer directly.** A nullable
  reference (`taskId`/`subtaskId`) plus a snapshotted label string on
  `TimerInstance`/`TimerSession`, offered from the Timers side only (not a
  button added _to_ a Task/Subtask).
- **"Start a Pomodoro now" in the chat plan preview.** `PlanPreviewCard` gains a
  second action next to "Send to Tasks": starts a Pomodoro session in the
  Timers tab directly, no `/api/tasks` call, labeled with the plan's task
  title, using the first step's Pomodoro-shaped estimate to prefill focus/break
  minutes.
- **Chat plan estimates become Pomodoro-shaped**, expressed as a suggested
  focus-block count + break pattern for display, still editable before
  confirming either action.

## Timers tab rethink — implemented

2026-08-19, same day, branch `iteration/08b-timers-rethink`. Built the design
spec above end to end. Tried locally and approved by the user the same day;
pushed and merged into `main`.

- **Pomodoro-as-default:** `TimersTab`'s composer now leads with a single
  full-width "Start a Pomodoro" button (`useTimersTab`'s new
  `openPomodoroDialog`, decoupled entirely from `selectedPresetId`) that opens
  `PomodoroDialog` directly. Short break/Long break/Custom moved into a
  collapsed-by-default "Other timer options" row
  (`isOtherTimersOpen`/`toggleOtherTimers`); `selectedPresetId`'s initial value
  moved off `pomodoro-focus` to `short-break` since Focus is no longer offered
  there. The old `openAddDialog` "select `pomodoro-focus` → routes to the
  Pomodoro dialog anyway" branch was kept as defense in depth rather than
  deleted, even though the secondary row can't produce that selection anymore.
- **Optional task/subtask link:** new `timerSessions.taskId`/`subtaskId`/
  `taskLabel` columns (nullable, `onDelete: 'set null'`, migration
  `0004_glorious_zarek.sql`) plus matching fields on the client's
  `TimerInstance`/`TimerSession`. `POST /api/timer-sessions` verifies a given
  `taskId`/`subtaskId` actually belongs to the caller
  (`verifyTaskLinkOwnership`, same IDOR-safe pattern as
  `conversationBelongsToUser`) before writing it. New `TaskLinkPicker`
  component (plain MUI `Autocomplete`, **not** `freeSolo`) appears in both
  `AddTimerDialog` and `PomodoroDialog` whenever `useTimersTab`'s
  `taskLinkOptions` is non-empty (fetched via the Tasks feature's own
  `fetchTasks`). `TimersTab.utils.ts`'s `buildTaskLinkOptions` flattens Tasks
  into one option per Task (skipped entirely if every one of its Subtasks is
  already completed) plus one per incomplete Subtask, labeled "Task →
  Subtask." Linked sessions show their label on the active timer card and in
  session history.
- **Chat → Timers bridge:** `PlanPreviewCard` gained "Start a Pomodoro now" —
  `useAiChatTab`'s new `startPomodoroFromPlan` calls
  `navigate('/timers', { state: { startPomodoro: {...} } })` with no
  `/api/tasks` call at all. `useTimersTab` consumes that router state once on
  mount (`consumedPomodoroPrefillRef`, the same one-shot-ref shape as
  `useAiChatTab`'s own `consumedDeepLinkConversationIdRef`) and opens
  `PomodoroDialog` pre-filled from it.
- **Chat plan estimates, Pomodoro-shaped — resolved as display-only.** Rather
  than changing `buildPlanSystemPrompt`'s requested JSON shape, a step's
  existing `minutes` stays the sole source of truth end to end; a new pure
  helper, `estimatePomodoroBreakdown` (`AiChatTab.utils.ts`, reusing the
  Timers tab's own `DEFAULT_POMODORO_FOCUS_MINUTES`/`_BREAK_MINUTES`), derives
  a block count fresh on every render for display only and to prefill the
  bridge above. Smaller, no schema/prompt risk, reversible later without a
  migration if a stored breakdown turns out to be wanted after all.
- **Tests:** `useTimersTab.test.ts` needed a `MemoryRouter` wrapper
  (`renderTimersHook`) since the hook now reads router state; every
  Pomodoro-flow test that used to rely on `pomodoro-focus` being the default
  `selectedPresetId` was switched to call the new `openPomodoroDialog`
  directly. `TimersTab.test.tsx` likewise needed `MemoryRouter`, plus an
  `openOtherTimers` test helper that's a no-op if the secondary row is already
  open. New coverage: `buildTaskLinkOptions`, the task-link fields
  round-tripping through `parseCreateTimerSessionBody`, and
  `estimatePomodoroBreakdown`.
- **Not done in this pass:** no new Playwright e2e spec for the chat → Timers
  bridge specifically (the existing `chat-to-tasks.spec.ts` still only covers
  "Send to Tasks"); `npm audit` not re-run since no dependency changed.

## Header + 3-tab nav (iteration 5, mid-course UI change)

Added a fixed header (`src/app/Header`) with the app logo/name, always rendered
— above the sign-in screen too, not just the signed-in app. Settings moved out
of the bottom nav into the header (avatar + gear icon) since it's an
account-level concern, not a core feature tab; the bottom nav became 3 tabs
(Timers, AI Chat, Dashboard). `/settings` stayed a real route, just reached
differently. Extracted `useClerkAppearanceVariables` (`src/theme/`) so the
Clerk-theming object (used by SignIn, and now both UserButton instances) isn't
hand-copied per component.

- **Avatar + gear unified into one control (2026-08-19, small standalone fix,
  same session as the Timers rethink but unrelated to it — done on the same
  branch since nothing had been committed yet):** the user found the
  avatar-plus-separate-gear-icon pairing confusing — two adjacent controls that
  read as peers but opened genuinely different things (Clerk's own
  profile/account menu vs. this app's own Settings page). Fix: the gear
  `IconButton` is gone; `<UserButton>` now renders a custom
  `<UserButton.MenuItems>` item (`<UserButton.Action>`, not
  `<UserButton.Link>`, specifically so clicking it calls `useHeader`'s
  `goToSettings` — a real React Router `navigate('/settings')` — instead of an
  `href` navigation, which would have full-page-reloaded since `ClerkProvider`
  isn't configured with `routerPush`/`routerReplace` here). `useHeader.ts`
  lost `isSettingsActive` along with it. Settings' own explicit "Sign out"/
  "Delete account" buttons are untouched — only the entry point into the
  Settings _page_ moved.

## Settings tab (iteration 5)

Profile/account management delegated to Clerk's `<UserButton>` (themed with our
design tokens) instead of hand-building name/avatar/email editing — same
reasoning as using `<SignIn>` in iteration 3: password/email-change flows have
real security implications better left to Clerk's tested UI. Kept explicit
"Sign out" and "Delete account" buttons outside that menu rather than relying
on Clerk's embedded versions, since an always-visible, plainly-labeled action is
more predictable than one buried a click deep in a dropdown. Delete account
(`user.delete()`) needed no special Clerk Dashboard toggle — verified end-to-end
by actually deleting a real test account. Wired `@clerk/localizations`
(`en-US`/`es-ES` subpath imports) so Clerk's own UI follows the app's
language instead of staying stuck in English. Costs ~170kB raw / ~43kB gzipped
for both locales combined.

## Neon/Drizzle setup (iteration 4)

`/db` lives at the repo root, not under `src/`, specifically so it can never be
imported from client code — only `/api` and `drizzle-kit` touch it. Language
preference is genuinely account-synced (`GET`/`PUT /api/preferences`,
authenticated via a Clerk session token), not just seeded once by the webhook.
Skipped `@vercel/node` as a dependency (hand-rolled minimal request/response
types instead) — it pulled in ~10 transitive CVEs for what we only needed as
type declarations. One accepted risk remains (`esbuild` via `drizzle-kit`,
dev-only, not network-exposed in how we use it) — documented in
[docs/SECURITY.md](./SECURITY.md#accepted-risks).

## Vercel build failing on every `/api`/`/db` file

Found post-v0.8.0 merge, fixed on branch `fix/vercel-esm-import-extensions`.
`tsc -b` passed clean locally, but Vercel's own build kept failing with
`TS2307` ("Cannot find module") and `TS2835` ("Relative import paths need
explicit file extensions ... when '--moduleResolution' is 'node16' or
'nodenext'") across `preferences.ts`, `timer-sessions.ts`,
`timer-sessions.utils.ts`, and their test files. Root cause:
`tsconfig.api.json` sets `"moduleResolution": "bundler"` (matching how Vite
bundles `src/`, so extensionless relative imports resolve fine there), but
Vercel's own per-function build step for `/api` doesn't honor that — with
`"type": "module"` in `package.json`, it resolves each function under Node's
real ESM rules (`node16`/`nodenext`), which require the literal `.js`
extension on a relative import even though the source file is `.ts`. Fixed by
adding `.js` to every relative import across `api/` and `db/` (`./foo` →
`./foo.js`); `tsc -b`'s own `bundler` resolution accepts a `.js` specifier
pointing at a same-named `.ts` file without complaint, so this satisfies both
build paths at once. `src/` is unaffected — Vite's bundler resolution there
was never the problem.

## Vite dev-server blank flash (iteration 4, fixed)

The first time a Clerk-authenticated route rendered under `npm run dev`, Vite's
dependency scanner discovered `@clerk/backend`/`drizzle-orm`/
`@neondatabase/serverless` as "new dependencies" and force-reloaded the page (a
~1-3s blank flash) — confirmed via `src/` having zero references to any of
them, and the production bundle containing none of them either, so this was
dev-server-only. Fixed by adding them to `optimizeDeps.exclude` in
`vite.config.ts`. Found by actually driving the app end-to-end (sign-in → all 4
tabs → language/theme toggles → sign out) with Playwright rather than only
running `lint`/`test`/`build` — worth doing that full pass again for future
iterations that touch auth or routing.
