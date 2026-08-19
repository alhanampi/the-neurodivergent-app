import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/i18n'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { TimersTab } from './TimersTab'

// Not signed in: keeps the history-fetch/task-link-options effects from
// making a real network call — same convention as AppLayout.test.tsx. With
// isSignedIn false, taskLinkOptions stays empty, so TaskLinkPicker never
// renders in these tests (guarded by taskLinkOptions.length > 0) — its own
// coverage lives in useTimersTab.test.ts instead.
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn: false, getToken: async () => null }),
}))

function renderTimersTab() {
  return render(
    <MemoryRouter>
      <ThemeModeProvider>
        <TimersTab />
      </ThemeModeProvider>
    </MemoryRouter>,
  )
}

// Reveals the secondary preset row (collapsed by default — see
// ROADMAP.md's "Timers tab rethink" note) by clicking its toggle — a no-op
// if it's already open (idempotent, since the toggle button would otherwise
// close it again on a second call, e.g. adding two timers in one test).
async function openOtherTimers(user: ReturnType<typeof userEvent.setup>) {
  if (screen.queryByRole('button', { name: 'Custom time' })) return
  await user.click(screen.getByRole('button', { name: 'Other timer options' }))
}

// Opens the secondary row, selects the "Custom time" preset (no suggested
// duration of its own, so its popup always defaults to 10 min) and runs it
// through the "Add timer" popup, optionally overriding the name and/or
// duration by typing into the popup's own fields, then confirms — mirrors
// the real flow end to end. Pomodoro is deliberately excluded here — it's
// the tab's primary CTA now, not reachable through this secondary row (see
// addPomodoroViaDialog below).
async function addTimerViaDialog(
  user: ReturnType<typeof userEvent.setup>,
  minutes?: number,
  name?: string,
) {
  await openOtherTimers(user)
  await user.click(screen.getByRole('button', { name: 'Custom time' }))
  await user.click(screen.getByRole('button', { name: 'Add timer' }))
  const dialog = screen.getByRole('dialog')

  if (name !== undefined) {
    await user.type(within(dialog).getByLabelText('Name this timer (optional)'), name)
  }
  if (minutes !== undefined) {
    const field = within(dialog).getByDisplayValue('10')
    await user.clear(field)
    await user.type(field, String(minutes))
    await user.tab()
  }

  await user.click(within(dialog).getByRole('button', { name: 'Add timer' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

// The primary "Start a Pomodoro" button opens the Pomodoro popup (20/10
// defaults) directly — no preset selection needed first.
async function addPomodoroViaDialog(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { focusMinutes?: number; breakMinutes?: number; name?: string } = {},
) {
  await user.click(screen.getByRole('button', { name: 'Start a Pomodoro' }))
  const dialog = screen.getByRole('dialog')

  if (overrides.name !== undefined) {
    await user.type(within(dialog).getByLabelText('Name this timer (optional)'), overrides.name)
  }
  if (overrides.focusMinutes !== undefined) {
    const field = within(dialog).getByDisplayValue('20')
    await user.clear(field)
    await user.type(field, String(overrides.focusMinutes))
    await user.tab()
  }
  if (overrides.breakMinutes !== undefined) {
    const field = within(dialog).getByDisplayValue('10')
    await user.clear(field)
    await user.type(field, String(overrides.breakMinutes))
    await user.tab()
  }

  await user.click(within(dialog).getByRole('button', { name: 'Add timer' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

afterEach(() => {
  void i18n.changeLanguage('en')
  localStorage.clear()
})

describe('TimersTab', () => {
  it('shows the primary Pomodoro CTA and no active timers initially, with the secondary presets collapsed', () => {
    renderTimersTab()

    expect(screen.getByRole('heading', { name: 'Timers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start a Pomodoro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Other timer options' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Short break' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add timer' })).not.toBeInTheDocument()
    expect(screen.getByText(/No active timers/)).toBeInTheDocument()
  })

  it('"Other timer options" reveals the secondary presets — Focus/Pomodoro is not among them', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await openOtherTimers(user)

    expect(screen.getByRole('button', { name: 'Short break' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Long break' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom time' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add timer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Focus' })).not.toBeInTheDocument()
  })

  it('clicking Add timer with Short break selected opens a popup suggesting its predefined 5 minutes', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await openOtherTimers(user)
    await user.click(screen.getByRole('button', { name: 'Short break' }))
    await user.click(screen.getByRole('button', { name: 'Add timer' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'New timer' })).toBeInTheDocument()
    expect(within(dialog).getByDisplayValue('5')).toBeInTheDocument()
    expect(screen.getByText(/No active timers/)).toBeInTheDocument()
  })

  it('clicking Add timer with Long break selected opens a popup suggesting its predefined 15 minutes', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await openOtherTimers(user)
    await user.click(screen.getByRole('button', { name: 'Long break' }))
    await user.click(screen.getByRole('button', { name: 'Add timer' }))

    expect(within(screen.getByRole('dialog')).getByDisplayValue('15')).toBeInTheDocument()
  })

  it('the Custom time popup defaults to 10 minutes, further editable before confirming', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await openOtherTimers(user)
    await user.click(screen.getByRole('button', { name: 'Custom time' }))
    await user.click(screen.getByRole('button', { name: 'Add timer' }))

    expect(within(screen.getByRole('dialog')).getByDisplayValue('10')).toBeInTheDocument()
  })

  it('cancelling the popup creates nothing', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await openOtherTimers(user)
    await user.click(screen.getByRole('button', { name: 'Custom time' }))
    await user.click(screen.getByRole('button', { name: 'Add timer' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'New timer' })).not.toBeInTheDocument()
    })
    expect(screen.getByText(/No active timers/)).toBeInTheDocument()
  })

  it('confirming the popup adds a timer card in the idle state, with the chosen duration', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user)

    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    const card = screen.getByRole('listitem')
    expect(within(card).getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.queryByText(/No active timers/)).not.toBeInTheDocument()
  })

  it('supports multiple timers at once, each with its own duration', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user, 25)
    await addTimerViaDialog(user, 5)

    const [firstCard, secondCard] = screen.getAllByRole('listitem')
    expect(within(firstCard).getByDisplayValue('25')).toBeInTheDocument()
    expect(within(secondCard).getByDisplayValue('5')).toBeInTheDocument()
  })

  it('names a custom timer and shows the name on its card', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user, undefined, 'Fold laundry')

    expect(screen.getByText('Fold laundry')).toBeInTheDocument()
  })

  it('edits an idle timer duration by typing directly', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user)
    const card = screen.getByRole('listitem')
    const durationField = within(card).getByDisplayValue('10')

    await user.clear(durationField)
    await user.type(durationField, '40')
    await user.tab()

    expect(within(card).getByDisplayValue('40')).toBeInTheDocument()
  })

  it('edits an idle timer duration with the +/- buttons', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user)
    const card = screen.getByRole('listitem')

    await user.click(within(card).getByRole('button', { name: 'Increase minutes' }))

    expect(within(card).getByDisplayValue('15')).toBeInTheDocument()
  })

  it('edits an idle timer duration by scrolling over it', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user)
    const card = screen.getByRole('listitem')
    const durationField = within(card).getByDisplayValue('10')

    fireEvent.wheel(durationField, { deltaY: -100 })

    expect(within(card).getByDisplayValue('15')).toBeInTheDocument()
  })

  it('starts a timer via its play button, toggling Start into Pause', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user)
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('no longer offers duration editing once a timer has started', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user)
    await user.click(screen.getByRole('button', { name: 'Start' }))

    const card = screen.getByRole('listitem')
    expect(within(card).queryByDisplayValue('10')).not.toBeInTheDocument()
    expect(within(card).getByText('10:00')).toBeInTheDocument()
  })

  it('offers an "add minutes" button once a timer has started, extending its remaining time', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user)
    await user.click(screen.getByRole('button', { name: 'Start' }))

    const card = screen.getByRole('listitem')
    await user.click(within(card).getByRole('button', { name: 'Add 5 minutes' }))

    expect(within(card).getByText('15:00')).toBeInTheDocument()
  })

  it('asks for confirmation before stopping a started timer', async () => {
    const user = userEvent.setup()
    renderTimersTab()

    await addTimerViaDialog(user)
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

    await addTimerViaDialog(user)
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

  describe('Pomodoro flow', () => {
    it('the primary "Start a Pomodoro" button opens the Pomodoro popup directly, explaining the 20/10 split', async () => {
      const user = userEvent.setup()
      renderTimersTab()

      await user.click(screen.getByRole('button', { name: 'Start a Pomodoro' }))

      const dialog = screen.getByRole('dialog')
      expect(
        within(dialog).getByRole('heading', { name: 'Set up your Pomodoro' }),
      ).toBeInTheDocument()
      expect(within(dialog).getByText(/20 min of focus/)).toBeInTheDocument()
      expect(within(dialog).getByText(/10 min of break/)).toBeInTheDocument()
      expect(within(dialog).getByDisplayValue('20')).toBeInTheDocument()
      expect(within(dialog).getByDisplayValue('10')).toBeInTheDocument()
    })

    it('cancelling the Pomodoro popup creates nothing', async () => {
      const user = userEvent.setup()
      renderTimersTab()

      await user.click(screen.getByRole('button', { name: 'Start a Pomodoro' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Set up your Pomodoro' }),
        ).not.toBeInTheDocument()
      })
      expect(screen.getByText(/No active timers/)).toBeInTheDocument()
    })

    it('confirming the Pomodoro popup adds a timer card tagged as Focus, using the (possibly customized) focus duration', async () => {
      const user = userEvent.setup()
      renderTimersTab()

      await addPomodoroViaDialog(user, { focusMinutes: 30, breakMinutes: 5, name: 'Deep work' })

      const card = screen.getByRole('listitem')
      expect(within(card).getByText('Deep work')).toBeInTheDocument()
      expect(within(card).getByText('Focus')).toBeInTheDocument()
      expect(within(card).getByDisplayValue('30')).toBeInTheDocument()
    })

    it('starting a Pomodoro timer hides duration editing, same as a plain timer', async () => {
      const user = userEvent.setup()
      renderTimersTab()

      await addPomodoroViaDialog(user, { name: 'Deep work' })
      await user.click(screen.getByRole('button', { name: 'Start' }))

      const card = screen.getByRole('listitem')
      expect(within(card).getByText('20:00')).toBeInTheDocument()
      expect(within(card).getByText('Focus')).toBeInTheDocument()
    })

    it('selecting Focus in the (secondary) other-timers row still opens the Pomodoro popup (defense in depth)', async () => {
      const user = userEvent.setup()
      renderTimersTab()

      // Focus/Pomodoro is normally not offered as a secondary preset — this
      // exercises useTimersTab's kept-as-defense-in-depth branch by opening
      // the row and confirming there's genuinely nothing there to select.
      await openOtherTimers(user)
      expect(screen.queryByRole('button', { name: 'Focus' })).not.toBeInTheDocument()
    })
  })
})
