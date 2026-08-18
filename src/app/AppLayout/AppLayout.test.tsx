import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/i18n'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { AppLayout } from './AppLayout'

// AppLayout itself isn't auth-gated (App.tsx wraps it in ClerkProvider +
// AuthGate) — but SettingsTab and useLanguagePreference read Clerk state via
// these hooks, so they need a stand-in here rather than a real
// (network-calling) ClerkProvider. isSignedIn: false keeps
// useLanguagePreference from trying to fetch /api/preferences.
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: { primaryEmailAddress: { emailAddress: 'test@example.com' }, username: null },
  }),
  useClerk: () => ({ signOut: vi.fn() }),
  useAuth: () => ({ isSignedIn: false, getToken: async () => null }),
  UserButton: () => null,
}))

function renderAppLayout(initialEntries: string[] = ['/']) {
  return render(
    <ThemeModeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <AppLayout />
      </MemoryRouter>
    </ThemeModeProvider>,
  )
}

afterEach(() => {
  // Language/theme changes persist to the shared i18next instance and
  // localStorage — reset both so one test's choices can't leak into the next.
  void i18n.changeLanguage('en')
  localStorage.clear()
})

describe('AppLayout', () => {
  it('renders the three bottom navigation tabs (Settings moved to the header)', () => {
    renderAppLayout()

    expect(screen.getByRole('button', { name: 'Timers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AI Chat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it('shows the Timers tab content by default at the root path', () => {
    renderAppLayout()

    expect(screen.getByRole('heading', { name: 'Timers' })).toBeInTheDocument()
  })

  it('reaches Settings by URL (as the header does) with no bottom tab highlighted', () => {
    renderAppLayout(['/settings'])

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    // MUI's BottomNavigation marks the selected action with aria-selected="true" —
    // none of the three tabs should have it, since Settings isn't one of them.
    for (const name of ['Timers', 'AI Chat', 'Dashboard']) {
      expect(screen.getByRole('button', { name })).not.toHaveAttribute('aria-selected', 'true')
    }
  })

  it('switches the UI language when the user changes it in Settings', async () => {
    const user = userEvent.setup()
    renderAppLayout(['/settings'])

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Español' }))

    expect(await screen.findByRole('heading', { name: 'Ajustes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chat IA' })).toBeInTheDocument()
    // "Timers" is kept as-is in Spanish (a short, widely understood loanword)
    // rather than translated to the much longer "Temporizadores" — see
    // src/i18n/locales/es/common.json.
    expect(screen.getByRole('button', { name: 'Timers' })).toBeInTheDocument()
  })
})
