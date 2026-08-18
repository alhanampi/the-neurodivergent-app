# The Neurodivergent App

A mobile-first Progressive Web App built to help neurodivergent people (ADHD,
autism, and beyond) get organized without fighting their tools. No walls of
settings, no rigid to-do lists that fall apart the moment life doesn't cooperate —
just a small set of focused tools that adapt to how you actually work.

Bilingual from day one (English/Spanish), installable on your phone like a native
app, and built one small, usable iteration at a time.

🔗 **Live:** [the-neurodivergent-app.vercel.app](https://the-neurodivergent-app.vercel.app)

## What it does

The app is organized around four tabs at the bottom of the screen:

- **⏱️ Timers** — Set a timer and get notified when it's done (pomodoros, 20-minute
  focus blocks, whatever works for you), or just start a stopwatch and mark it
  finished whenever you are. Every session gets saved, so you build up a real
  picture of how you spend your time.
- **💬 AI Chat** — Not stuck staring at a huge task, unsure where to start? Talk it
  through with an assistant whose only job is helping you break it into smaller,
  doable steps. Once you're happy with the plan, send it straight to Timers — each
  step arrives with its own estimated time.
- **📊 Dashboard** — A look back at what you got done: completed tasks, time spent,
  streaks, patterns over time.
- **⚙️ Settings** — Language, theme, account, and (as the app grows) connected
  integrations.

Coming later: **badges** for showing up and finishing things, **social sharing** of
your wins, two-way integrations with **Google Calendar** and
**Spotify/SoundCloud** (so a "study for 20 minutes" task can queue up a focus
playlist automatically), more **themes/languages/fonts** (including a
dyslexia-friendly option), a **relaxation tab** with animated breathing exercises
(box breathing, expanding waves) and calming music, and a **task roulette** that
randomly picks a pending task
for you (weighted by difficulty and time of day) so you don't have to decide.

## Tech stack

| Piece     | Choice                                                                                                  | Why                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework | [Vite](https://vitejs.dev/) + React + TypeScript                                                        | The app lives behind a login, so there's no need for server-rendering — Vite keeps the build simple and fast |
| Hosting   | [Vercel](https://vercel.com/)                                                                           | Ships the PWA and hosts small serverless functions for anything that needs a secret key                      |
| Auth      | [Clerk](https://clerk.com/)                                                                             | Handles sign-in/sign-up and sessions so we don't have to roll our own                                        |
| Database  | [Neon](https://neon.tech/) (Postgres) + Drizzle ORM                                                     | Serverless Postgres that plugs neatly into Vercel                                                            |
| UI        | [MUI](https://mui.com/) + [react-icons](https://react-icons.github.io/react-icons/) + styled-components | Accessible components, one icon set, styles kept clean and separate from logic                               |
| AI        | [Groq](https://groq.com/)                                                                               | Fast, free-tier LLM inference powering the AI Chat tab                                                       |
| Language  | [react-i18next](https://react.i18next.com/)                                                             | Real-time English/Spanish switching, remembers what you prefer                                               |

## How this project is built

This app is being built **one iteration at a time**, each as its own Git branch,
rather than all at once. Every iteration is run and tried out locally first —
nothing gets pushed to GitHub or merged into `main` until it's been approved by
hand. It's a slower way to ship, and that's the point: each piece gets to be
actually looked at before it becomes part of the app.

The full plan below is a living document — see [ROADMAP.md](./ROADMAP.md) for the
source of truth on status. If you're contributing or picking this up with an AI
coding assistant, start with [CLAUDE.md](./CLAUDE.md) for the coding conventions
this repo follows, and [docs/](./docs) for architecture and security notes.

## Roadmap

| Version | What it adds                                                                           | Status         |
| ------- | -------------------------------------------------------------------------------------- | -------------- |
| v0.1.0  | Project docs and repo setup                                                            | ✅ done        |
| v0.2.0  | App scaffold: navigation shell, PWA basics, CI, first deploy                           | ✅ done        |
| v0.3.0  | Language switching + visual theme                                                      | ✅ done        |
| v0.4.0  | Login with Clerk                                                                       | ✅ done        |
| v0.5.0  | Database (Neon) wired up                                                               | ✅ done        |
| v0.6.0  | Settings tab                                                                           | 🚧 in progress |
| v0.7.0  | Timers tab                                                                             | ⏳ pending     |
| v0.8.0  | Dashboard tab                                                                          | ⏳ pending     |
| v0.9.0  | AI Chat tab (Groq)                                                                     | ⏳ pending     |
| v0.10.0 | Security & accessibility hardening                                                     | ⏳ pending     |
| v0.11.0 | Badges and social sharing                                                              | ⏳ pending     |
| v0.12.0 | Google Calendar integration                                                            | ⏳ pending     |
| v0.13.0 | Spotify/SoundCloud integration                                                         | ⏳ pending     |
| v1.0.0  | App store packaging                                                                    | ⏳ pending     |
| v1.1.0  | Choice of AI model for different needs (quick vs. deeper reasoning)                    | ⏳ pending     |
| v1.2.0  | More themes, more languages, dyslexia-friendly font option                             | ⏳ pending     |
| v1.3.0  | Relaxation tab: animated breathing exercises (box breathing, waves) + calming music    | ⏳ pending     |
| v1.4.0  | Task roulette: spin for a random pending task, earn points by difficulty, share badges | ⏳ pending     |

## Getting started

```sh
cp .env.example .env.local   # fill in Clerk + Neon values, see below
npm install
npm run db:migrate   # applies the schema to your Neon database
npm run dev          # starts the local dev server
npm run build         # production build (type-checks first)
npm run preview       # serves the production build locally
npm run test          # unit tests
npm run lint           # oxlint
```

You'll need a free [Clerk](https://dashboard.clerk.com) application for sign-in,
and a [Neon](https://neon.tech) Postgres database (or Vercel's Storage tab → Neon
integration) — see `.env.example` for which key goes where.

**`npm run dev` doesn't run `/api`** — Vite's dev server only serves the frontend,
so the Clerk webhook and the preferences sync silently no-op locally (the app
still works, language just stays localStorage-only instead of following your
account). To exercise `/api` routes locally too, use `vercel dev` instead (needs
the Vercel CLI linked to this project: `vercel link`).
