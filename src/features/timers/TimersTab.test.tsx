import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n/i18n'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { TimersTab } from './TimersTab'

// Not signed in: keeps the history-fetch effect from making a real network
// call — same convention as AppLayout.test.tsx.
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn: false, getToken: async () => null }),
}))

function renderTimersTab() {
  return render(
    <ThemeModeProvider>
      <TimersTab />
    </ThemeModeProvider>,
  )
}

afterEach(() => {
  void i18n.changeLanguage('en')
})

describe('TimersTab', () => {
  it('shows the preset options and the default preset duration', () => {
    renderTimersTab()

    expect(screen.getByRole('heading', { name: 'Timers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Focus' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Short break' })).toBeInTheDocument()
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('starts a timer and swaps the Start button for Pause/Stop', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument()
  })

  it('shows the custom minutes stepper and label field only for the custom preset', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    expect(
      screen.queryByPlaceholderText('What are you working on? (optional)'),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Custom' }))

    expect(screen.getByPlaceholderText('What are you working on? (optional)')).toBeInTheDocument()
    expect(screen.getByText('10 min')).toBeInTheDocument()
  })

  it('shows the empty history state when there are no sessions', () => {
    renderTimersTab()

    expect(screen.getByText(/No sessions yet/)).toBeInTheDocument()
  })
})
