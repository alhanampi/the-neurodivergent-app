import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { DashboardTab } from './DashboardTab'

let isSignedIn = false
// A stable reference — recreating this inline on every useAuth() call would
// change the hook's effect dependency on every render and cause a refetch
// loop (the same pitfall useTimersTab.test.ts's mockGetToken avoids).
const mockGetToken = vi.fn(async () => 'token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn, getToken: mockGetToken }),
}))

const mockFetchTimerHistoryInRange = vi.fn(
  async (_startDate: Date, _endDate: Date, _getToken: unknown) => [] as unknown[],
)
vi.mock('./useDashboardTab.utils', () => ({
  fetchTimerHistoryInRange: (startDate: Date, endDate: Date, getToken: unknown) =>
    mockFetchTimerHistoryInRange(startDate, endDate, getToken),
}))

function renderDashboardTab() {
  return render(
    <ThemeModeProvider>
      <DashboardTab />
    </ThemeModeProvider>,
  )
}

describe('DashboardTab', () => {
  afterEach(() => {
    isSignedIn = false
    mockFetchTimerHistoryInRange.mockReset()
    mockFetchTimerHistoryInRange.mockResolvedValue([])
  })

  it('renders the title and the date-range filter presets', () => {
    renderDashboardTab()

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7 days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30 days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '90 days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All time' })).toBeInTheDocument()
  })

  it('shows the empty state when signed in with no sessions in range', async () => {
    isSignedIn = true
    renderDashboardTab()

    expect(
      await screen.findByText(
        'No sessions in this range yet — start a timer to see your stats here.',
      ),
    ).toBeInTheDocument()
  })

  it('shows stat tiles once sessions come back', async () => {
    isSignedIn = true
    mockFetchTimerHistoryInRange.mockResolvedValue([
      {
        id: 1,
        presetId: 'pomodoro-focus',
        label: null,
        plannedSeconds: 1500,
        actualSeconds: 1500,
        completed: true,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
      },
    ])
    renderDashboardTab()

    expect(await screen.findByText('25 min')).toBeInTheDocument()
    expect(screen.getByText('Total time')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('switches the selected range preset on click', async () => {
    isSignedIn = true
    const user = userEvent.setup()
    renderDashboardTab()

    await waitFor(() => expect(mockFetchTimerHistoryInRange).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('button', { name: '7 days' }))

    await waitFor(() => expect(mockFetchTimerHistoryInRange).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'true')
  })
})
