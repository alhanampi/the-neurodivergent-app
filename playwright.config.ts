import { defineConfig, devices } from '@playwright/test'

// Requires `vercel dev` running on http://localhost:3000, not plain
// `npm run dev` — /api routes aren't served under plain Vite dev (see
// vite.config.ts's own api-routes-404-in-dev comment). No `webServer` block
// here on purpose: Playwright doesn't start the dev server itself, since it
// needs the Vercel + Clerk/Neon/Groq env wiring only `vercel dev` provides.
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
