/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // `/api` routes are Vercel Serverless Functions, not part of the client
    // build — plain `npm run dev` has no idea about them (see the "vercel
    // dev" note in ROADMAP.md). Without this, a fetch to e.g.
    // `/api/timer-sessions` falls through to Vite's own module-serving
    // pipeline, which tries to transform the raw `api/*.ts` source file as
    // if it were a browser module. Usually that just silently returns
    // unparseable "JSON" (swallowed by the existing try/catch + `!res.ok`
    // checks in every fetch helper) — but a request with a query string
    // (e.g. the Dashboard tab's `?startDate=...&endDate=...`) trips up
    // Vite/oxc's module-type detection and hard-crashes the transform
    // instead, taking down the whole page. Intercepting `/api/*` here,
    // before Vite's internal middlewares run, turns both cases into one
    // clean 404 — exactly what the fetch helpers already expect and handle.
    {
      name: 'api-routes-404-in-dev',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api/')) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: '/api routes are not served by `npm run dev` — use `vercel dev` instead.',
              }),
            )
            return
          }
          next()
        })
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'The Neurodivergent App',
        short_name: 'ND App',
        description: 'Organize tasks, time, and focus — built for how your brain works.',
        theme_color: '#3E7C8C',
        background_color: '#F5F7F8',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // These are server-only (db/, api/) — src/ never imports them (verified:
    // no match for their names anywhere under src/). Vite's dev-time
    // dependency scanner nonetheless discovers them the first time a route
    // touching Clerk auth renders, forcing a one-time full-page reload
    // (blank flash, ~1-3s) mid-session. Excluding them here stops Vite from
    // pre-bundling them at all — if src/ ever does start importing one by
    // mistake, this now surfaces as a clear resolution error instead of a
    // silent reload, which is the outcome we actually want either way.
    exclude: ['@clerk/backend', '@neondatabase/serverless', 'drizzle-orm'],
  },
  // No chunkSizeWarningLimit override anymore (v0.10.0): every tab route is
  // now its own React.lazy chunk (see src/app/AppLayout/AppLayout.tsx)
  // instead of all bundled into one file. The single bundle had grown to
  // ~1.32MB raw / ~400kB gzipped by v0.9.0 (MUI + Clerk + i18next +
  // @mui/x-charts + react-markdown/remark-gfm/groq-sdk, all loaded up front
  // regardless of which tab you actually opened) — splitting it dropped the
  // main entry chunk to ~400kB raw / ~117kB gzipped, comfortably back under
  // Vite's default 500kB warning threshold, so the default is doing its job
  // again rather than being silenced.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // e2e/ holds Playwright specs (test.describe/test.skip from
    // @playwright/test, a different test runner) — Vitest's default include
    // glob picks up *.spec.ts too, so it must be excluded explicitly or
    // Vitest tries to execute it and fails immediately (test.describe()
    // called outside Playwright's own runner).
    exclude: ['**/node_modules/**', '**/dist/**', './e2e/**'],
    env: {
      // db/client.ts throws at import time if this is missing — tests for
      // api/ utils that don't actually run a query need a syntactically
      // valid placeholder so importing them doesn't crash.
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    },
  },
})
