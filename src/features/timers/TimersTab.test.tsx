import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  localStorage.clear()
})

describe('TimersTab', () => {
  it('shows the preset options and no active timers initially', () => {
    renderTimersTab()

    expect(screen.getByRole('heading', { name: 'Timers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Focus' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Short break' })).toBeInTheDocument()
    expect(screen.getByText(/No active timers/)).toBeInTheDocument()
  })

  it('adds a timer card in the idle state, with an editable duration', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))

    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    const card = screen.getByRole('listitem')
    expect(within(card).getByDisplayValue('25')).toBeInTheDocument()
    expect(screen.queryByText(/No active timers/)).not.toBeInTheDocument()
  })

  it('supports multiple timers at once, each with its own duration', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))
    await user.click(screen.getByRole('button', { name: 'Short break' }))
    await user.click(screen.getByRole('button', { name: /Add timer/ }))

    const [firstCard, secondCard] = screen.getAllByRole('listitem')
    expect(within(firstCard).getByDisplayValue('25')).toBeInTheDocument()
    expect(within(secondCard).getByDisplayValue('5')).toBeInTheDocument()
  })

  it('names a custom timer and shows the name on its card', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: 'Custom' }))
    await user.type(screen.getByPlaceholderText('Name this timer (optional)'), 'Fold laundry')
    await user.click(screen.getByRole('button', { name: /Add timer/ }))

    expect(screen.getByText('Fold laundry')).toBeInTheDocument()
  })

  it('edits an idle timer duration by typing directly', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))
    const card = screen.getByRole('listitem')
    const durationField = within(card).getByDisplayValue('25')

    await user.clear(durationField)
    await user.type(durationField, '40')
    await user.tab()

    expect(within(card).getByDisplayValue('40')).toBeInTheDocument()
  })

  it('edits an idle timer duration with the +/- buttons', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))
    const card = screen.getByRole('listitem')

    await user.click(within(card).getByRole('button', { name: 'Increase minutes' }))

    expect(within(card).getByDisplayValue('30')).toBeInTheDocument()
  })

  it('edits an idle timer duration by scrolling over it', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))
    const card = screen.getByRole('listitem')
    const durationField = within(card).getByDisplayValue('25')

    fireEvent.wheel(durationField, { deltaY: -100 })

    expect(within(card).getByDisplayValue('30')).toBeInTheDocument()
  })

  it('starts a timer via its play button, toggling Start into Pause', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('no longer offers duration editing once a timer has started', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))
    await user.click(screen.getByRole('button', { name: 'Start' }))

    const card = screen.getByRole('listitem')
    expect(within(card).queryByDisplayValue('25')).not.toBeInTheDocument()
    expect(within(card).getByText('25:00')).toBeInTheDocument()
  })

  it('asks for confirmation before stopping a started timer', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(screen.getByRole('button', { name: 'Stop' }))

    expect(screen.getByRole('heading', { name: 'Stop this timer?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Keep going' }))
    // MUI's Dialog unmounts its content only after its close transition
    // finishes, so the heading can briefly still be in the DOM.
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Stop this timer?' })).not.toBeInTheDocument()
    })
    // Still there — cancelling the dialog didn't remove the timer.
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('removes an untouched idle timer immediately, with no confirmation dialog', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: /Add timer/ }))
    await user.click(screen.getByRole('button', { name: 'Stop' }))

    expect(screen.queryByRole('heading', { name: 'Stop this timer?' })).not.toBeInTheDocument()
    expect(screen.getByText(/No active timers/)).toBeInTheDocument()
  })

  it('toggles the tick sound preference', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await user.click(screen.getByRole('button', { name: 'Enable tick sound' }))

    expect(screen.getByRole('button', { name: 'Disable tick sound' })).toBeInTheDocument()
  })

  it('shows the empty history state when there are no sessions', () => {
    renderTimersTab()

    expect(screen.getByText(/No sessions yet/)).toBeInTheDocument()
  })
})
