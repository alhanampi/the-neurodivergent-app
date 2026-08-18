/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
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
  build: {
    // MUI + Clerk + i18next + @clerk/localizations (2 full locales, ~170kB
    // raw between them) push the single bundle past Vite's 500kB default
    // warning threshold. Real fix is code-splitting (lazy-load heavier
    // per-route chunks) — tracked for v0.10.0 (security/perf hardening) —
    // this just stops the warning from being noise until then.
    chunkSizeWarningLimit: 750,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    env: {
      // db/client.ts throws at import time if this is missing — tests for
      // api/ utils that don't actually run a query need a syntactically
      // valid placeholder so importing them doesn't crash.
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    },
  },
})
