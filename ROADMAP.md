# Roadmap

Source of truth for iteration status. The table in `README.md` mirrors this one for
visitors — update both together.

Workflow reminder (full version in [CLAUDE.md](./CLAUDE.md#git-workflow--local-first-one-branch-per-iteration)):
each row below is one branch, built and run locally, approved by the user, and only
then pushed and merged into `main`.

Status legend: `pending` (not started) · `in progress` · `done`.

| Version | Branch                             | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Status      |
| ------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| v0.1.0  | `iteration/00-repo-bootstrap`      | Repo init, `CLAUDE.md`, `ROADMAP.md`, `docs/`, `README.md`                                                                                                                                                                                                                                                                                                                                                                                                            | done        |
| v0.2.0  | `iteration/01-app-scaffold`        | Vite + React + TS app; oxlint/Prettier/Husky; folder conventions; `vite-plugin-pwa` baseline (manifest + icons); bottom-tab navigation shell (React Router) with 4 placeholder tabs; Vitest + RTL; GitHub Actions CI; Vercel project connected and deployed                                                                                                                                                                                                           | done        |
| v0.3.0  | `iteration/02-i18n-theme`          | react-i18next with `en`/`es` resources; language auto-detect + persisted preference; MUI + styled-components theme bridge; design tokens; light/dark base                                                                                                                                                                                                                                                                                                             | done        |
| v0.4.0  | `iteration/03-auth-clerk`          | Clerk sign-in/up; protected routes; session handling; user menu                                                                                                                                                                                                                                                                                                                                                                                                       | done        |
| v0.5.0  | `iteration/04-database-neon`       | Neon Postgres + Drizzle ORM; schema (`users`, `preferences`); `/api` structure; Clerk webhook syncing user + language preference to DB; migrations workflow                                                                                                                                                                                                                                                                                                           | done        |
| v0.6.0  | `iteration/05-settings-tab`        | Full Settings tab: language, theme, profile/account (via Clerk), sign out, delete account; plus a fixed header (app identity, avatar, Settings shortcut) and the bottom nav trimmed to 3 tabs                                                                                                                                                                                                                                                                         | done        |
| v0.7.0  | `iteration/06-timers-tab`          | Timer/Pomodoro tab: presets + custom timers, manual start/stop tracking, notifications, session history persisted to Neon                                                                                                                                                                                                                                                                                                                                             | in progress |
| v0.8.0  | `iteration/07-dashboard-tab`       | Dashboard: charts/stats from timer history (MUI X Charts or Recharts), date-range filters                                                                                                                                                                                                                                                                                                                                                                             | pending     |
| v0.9.0  | `iteration/08-ai-chat-tab`         | AI chat tab via Groq (`/api/chat` proxy keeps the key server-side); system prompt is a task-breakdown assistant; streaming back-and-forth; "send plan to Timers" handoff creates timer entries with estimated durations                                                                                                                                                                                                                                               | pending     |
| v0.10.0 | `iteration/09-security-hardening`  | Full `security-review` pass; dependency audit / Dependabot; rate limiting on `/api`; CSP and security headers; accessibility pass (WCAG, reduced motion, ND-friendly UX); bundle code-splitting (MUI/Clerk push the main chunk past 500kB as of v0.4.0)                                                                                                                                                                                                               | pending     |
| v0.11.0 | `iteration/10-gamification`        | Badges/medals (streaks, task completions, daily login); achievements storage; social sharing (Web Share API + share-card image)                                                                                                                                                                                                                                                                                                                                       | pending     |
| v0.12.0 | `iteration/11-google-calendar`     | Google Calendar OAuth; two-way sync between tasks and events                                                                                                                                                                                                                                                                                                                                                                                                          | pending     |
| v0.13.0 | `iteration/12-music-integration`   | Spotify/SoundCloud OAuth; attach playlists to tasks/timers; auto-play for the timer's duration                                                                                                                                                                                                                                                                                                                                                                        | pending     |
| v1.0.0  | `iteration/13-app-store-packaging` | Capacitor/PWABuilder wrap evaluation; store assets; submission prep                                                                                                                                                                                                                                                                                                                                                                                                   | pending     |
| v1.1.0  | `iteration/14-model-selection`     | Let the user pick between multiple LLM models for the AI Chat tab for specific uses (e.g. a faster/cheaper model for quick check-ins vs. a stronger reasoning model for harder task breakdowns); model choice becomes a per-conversation or per-preference setting instead of one hardcoded model                                                                                                                                                                     | pending     |
| v1.2.0  | `iteration/15-personalization`     | More color themes beyond light/dark; more UI languages beyond en/es; font choice in Settings, including a dyslexia-friendly option (e.g. Atkinson Hyperlegible / OpenDyslexic)                                                                                                                                                                                                                                                                                        | pending     |
| v1.3.0  | `iteration/16-relaxation-tab`      | New tab: guided relaxation/mindfulness exercises with custom animations (box/square breathing, expanding-wave breathing, short grounding exercises — built in-house, no external API, timed animation paced to the actual breathing count) plus curated relaxation music/ambience via embedded public Spotify/SoundCloud playlists, mapped by category (focus, sleep, nature) rather than an algorithmic recommendation                                               | pending     |
| v1.4.0  | `iteration/17-task-roulette`       | New tab: user enters pending tasks with a difficulty level, spins a wheel (`react-custom-roulette`) to randomly get one to work on; harder tasks earn more points; user sets a points threshold that triggers a break suggestion + prompt to share the earned badge on social media; task selection is weighted by time-of-day relevance (e.g. a task tagged "buy groceries" gets a higher chance of coming up near store-closing time than a non-time-sensitive one) | pending     |

## Notes and open decisions

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
