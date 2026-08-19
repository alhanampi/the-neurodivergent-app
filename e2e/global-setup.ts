import { clerkSetup } from '@clerk/testing/playwright'

// Fetches a Clerk testing token using VITE_CLERK_PUBLISHABLE_KEY +
// CLERK_SECRET_KEY from .env.local (already required for the app itself to
// run — @clerk/testing reads them automatically, no new keys needed here).
// The per-spec E2E_CLERK_TEST_EMAIL/PASSWORD used to actually sign in are a
// separate, optional requirement — see e2e/chat-to-tasks.spec.ts's own
// test.skip() guard.
export default async function globalSetup() {
  await clerkSetup()
}
