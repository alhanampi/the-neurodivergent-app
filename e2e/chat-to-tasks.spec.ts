import { expect, test } from '@playwright/test'
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'

// The critical flow CLAUDE.md calls out by name (originally "sending a
// chat-built plan to the Timers tab" — the iteration 8 notes in ROADMAP.md
// explain why the destination became Tasks instead). Needs a real Clerk
// sign-in (no way around that — the whole app sits behind AuthGate), but
// /api/chat, /api/chat-plan, and /api/tasks are all mocked at the network
// layer below, so this needs no GROQ_API_KEY and produces no Groq spend.
const testEmail = process.env.E2E_CLERK_TEST_EMAIL
const testPassword = process.env.E2E_CLERK_TEST_PASSWORD

test.describe('AI Chat → Tasks handoff', () => {
  test.skip(
    !testEmail || !testPassword,
    'Requires a Clerk test-mode user — set E2E_CLERK_TEST_EMAIL/E2E_CLERK_TEST_PASSWORD in .env.local (see .env.example). Create a dedicated test-mode user in the Clerk dashboard, not a personal account.',
  )

  test('sends a message, converts it to a plan, and sends the plan to Tasks', async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/')
    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: testEmail!, password: testPassword! },
    })
    await page.goto('/chat')

    await page.route('**/api/chat', async (route) => {
      const body = [
        'data: {"type":"token","value":"Sure, "}\n\n',
        'data: {"type":"token","value":"let\'s break that down."}\n\n',
        'data: {"type":"done","conversationId":999999,"messageId":1,"title":"Clean the kitchen"}\n\n',
      ].join('')
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body })
    })

    await page.route('**/api/chat-plan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: {
            steps: [
              { title: 'Clear the counters', minutes: 5 },
              { title: 'Wash the dishes', minutes: 15 },
            ],
          },
        }),
      })
    })

    // Covers both the POST from "Send to Tasks" and the GET the Tasks tab
    // fires on mount right after — same fake list either way, so the page
    // shows consistent data across the navigation.
    const fakeTasks = [
      {
        id: 1,
        title: 'Clear the counters',
        estimatedMinutes: 5,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: 2,
        title: 'Wash the dishes',
        estimatedMinutes: 15,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
    ]
    await page.route('**/api/tasks', async (route) => {
      const status = route.request().method() === 'POST' ? 201 : 200
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: fakeTasks }),
      })
    })

    await page.getByPlaceholder(/Tell me what you're working on/).fill('Help me clean the kitchen')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByText("Sure, let's break that down.")).toBeVisible()

    await page.getByRole('button', { name: 'Convert to plan' }).click()

    // PlanPreviewCard's step-title fields have no accessible name of their
    // own (see PlanPreviewCard.tsx) — matched by their current value instead
    // of a Testing-Library-style getByDisplayValue, which Playwright's Page
    // doesn't have.
    await expect(page.locator('input[value="Clear the counters"]')).toBeVisible()
    await expect(page.locator('input[value="Wash the dishes"]')).toBeVisible()

    await page.getByRole('button', { name: 'Send to Tasks' }).click()

    await expect(page).toHaveURL(/\/tasks$/)
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
    await expect(page.getByText('Clear the counters')).toBeVisible()
    await expect(page.getByText('Wash the dishes')).toBeVisible()
  })
})
