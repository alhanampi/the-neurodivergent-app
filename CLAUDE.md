# CLAUDE.md

Instructions for Claude Code when working in this repository. Read this file first,
every session, before touching any code.

## Project summary

A mobile-first Progressive Web App that helps neurodivergent people organize their
day: a configurable timer/pomodoro system, an AI chat that breaks tasks into smaller
steps, a checklist of the tasks that chat produces, and a dashboard of completed
tasks and time stats. Fixed header (app identity; once signed in, avatar + Settings)
above a four-tab bottom navigation. Deployed to Vercel; a native app-store wrapper
(Capacitor or similar) is a later goal, not a current one.

Full iteration plan, current status, and scope-by-version: **[ROADMAP.md](./ROADMAP.md)**.
Always check ROADMAP.md before starting work to see what iteration is active and
what's explicitly out of scope for it.

## Tech stack

| Layer                  | Choice                                             | Why                                                                                           |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Build tool / framework | Vite + React + TypeScript                          | No SSR needed behind a login wall; simpler build; cleaner path to a Capacitor wrap later      |
| Hosting                | Vercel                                             | PWA static hosting + Serverless Functions in `/api` for anything needing secrets              |
| Auth                   | Clerk                                              | Hosted auth, handles sign-in/up, sessions, user management                                    |
| Database               | Neon (Postgres) + Drizzle ORM                      | Serverless Postgres that pairs natively with Vercel; Drizzle is lightweight and edge-friendly |
| UI components          | MUI                                                | Accessible component library, themable                                                        |
| Icons                  | react-icons                                        | Single icon import surface across the app                                                     |
| Styling                | styled-components                                  | Component styles always live in their own file — see Coding Standards                         |
| AI chat                | Groq (`openai/gpt-oss-120b`, see ROADMAP notes)    | Fast inference, generous free tier, good multilingual support for en/es                       |
| i18n                   | react-i18next                                      | Runtime English/Spanish switching, persisted user preference                                  |
| Testing                | Vitest + React Testing Library, Playwright for e2e | Unit/hook tests colocated, e2e for critical flows                                             |

Planned integrations (later iterations, see ROADMAP.md): Google Calendar, Spotify/SoundCloud,
gamification (badges/streaks) with social sharing.

## Coding standards

These are hard rules, not suggestions. Code review should reject anything that
violates them.

### File separation

Every component or feature unit is split into sibling files — never inline logic,
types, styles, or helpers inside the `.tsx` file:

- `Name.tsx` — JSX and wiring only. Calls a hook for logic, renders styled
  components for markup. No `useState`/`useEffect`/business logic here beyond
  trivial prop passing.
- `useName.ts` — the hook. All state, effects, derived values, and event handlers
  live here. If a `.tsx` file has logic that isn't pure rendering, it belongs in a
  hook.
- `Name.styles.ts` — all `styled-components` definitions for that unit.
- `Name.interfaces.ts` — TypeScript types/interfaces for that unit's props and
  domain data.
- `Name.utils.ts` — pure helper functions (formatting, calculations) with no React
  dependency, easy to unit test in isolation.
- `Name.constants.ts` — static data (config arrays, storage keys, enums-as-const)
  that isn't a function. Use when a value belongs next to `.utils.ts` in spirit but
  isn't itself a helper function.
- `Name.context.ts` — `createContext(...)` calls and nothing else. Keep the
  context's value _type_ in `.interfaces.ts` and import it here; this file holds
  only the runtime context object.
- `Name.test.tsx` / `useName.test.ts` — tests colocated with what they test.

**Exception — pure-read hooks are fine directly in a `.tsx`:** calling a hook that
only _reads_ existing state/context with no side effects to manage (`useTranslation()`,
`useThemeMode()`, `useContext(...)`) is still "pure rendering," not business logic —
no need to wrap it in a component-specific hook just to satisfy this rule. The
line is state/effects/derived-values/event-handler-logic: once a `.tsx` file has
any of those, that logic moves to `useName.ts`.

### Language

- All code, identifiers, comments, commit messages, and documentation are written
  in **English**, regardless of which language the app runs in for end users.
- The app itself is bilingual (English/Spanish) for users. Every user-facing string
  goes through i18n resource files (`en`/`es`) — never hardcode user-facing text in
  a component.
- The user's language preference is detected on first load, changeable in Settings,
  and persisted (`localStorage` until iteration 4 adds the DB-backed preference,
  then synced to the user's account).

### Security

- No API keys or secrets in client-side code or bundles. Any call to a third-party
  API (Groq, Google Calendar, Spotify/SoundCloud) goes through a Vercel Serverless
  Function under `/api`, which holds the secret server-side.
- Third-party npm packages are fine to use — this project is not dependency-averse —
  but a package must be actively maintained and free of known unpatched CVEs
  before it's added. Run `npm audit` before merging any iteration.
- Run the `security-review` skill before merging any iteration that touches auth,
  data storage, or an external API integration.
- See [docs/SECURITY.md](./docs/SECURITY.md) for the full checklist.

### Git workflow — local-first, one branch per iteration

Each row in ROADMAP.md is one iteration and one branch (`iteration/NN-name`).
**The workflow is local-first and requires explicit human approval before anything
reaches GitHub:**

1. Claude implements the iteration on its branch, locally.
2. The user runs it locally (`npm run dev`, or `npm run build && npm run preview`)
   and tries it out.
3. Only after the user explicitly approves it does Claude push the branch to
   GitHub and merge it into `main`.
4. Claude does not push a branch, open a PR, or merge on its own initiative —
   ever. Getting the user's go-ahead in one session doesn't carry over to the next
   iteration; ask again each time.
5. Update the status column in `ROADMAP.md` (`pending` → `in progress` → `done`) as
   the iteration moves through this cycle. Keep the roadmap table in `README.md` in
   sync with `ROADMAP.md` — they should never drift.

Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, etc).

### Testing

- New hooks and utils get unit tests (Vitest + React Testing Library).
- Critical user flows (auth, timer start/stop, sending a chat-built plan to the
  Timers tab) get a Playwright e2e test once that flow exists.

## Skills & agents

Available now, use every iteration:

- `security-review` — run before merging anything touching auth/data/external APIs.
- `code-review` — run for correctness and simplification passes.

Planned, to be built once there's a real component to scaffold from (iteration 1):

- `new-feature-tab` — scaffolds a new tab's folder with the full file split
  (`.tsx` / `useX.ts` / `.styles.ts` / `.interfaces.ts` / `.utils.ts`) and i18n key
  stubs, matching the convention above.
- `add-translation` — adds a new user-facing string to both `en` and `es` resource
  files together, so they can't drift out of sync.

No custom review agent is planned — the built-in `code-review` skill covers
correctness/simplification, and the file-split convention is enforced by this
document plus review.

## Docs

- [ROADMAP.md](./ROADMAP.md) — iterations, versions, status.
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — folder structure, navigation
  shell, data flow.
- [docs/SECURITY.md](./docs/SECURITY.md) — security checklist applied every
  iteration.
