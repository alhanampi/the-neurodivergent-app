import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { Header } from './Header'

// Mocks the real Clerk UserButton's compound-component shape (MenuItems/
// Action) just enough to test against — renders its menu content inline
// rather than simulating an actual dropdown open/close interaction, since
// that behavior belongs to Clerk, not this app.
function UserButtonMock({ children }: { children?: ReactNode }) {
  return (
    <div>
      <button aria-label="account menu">avatar</button>
      {children}
    </div>
  )
}
UserButtonMock.MenuItems = ({ children }: { children?: ReactNode }) => <div>{children}</div>
UserButtonMock.Action = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick}>{label}</button>
)

vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }: { children: ReactNode }) => children,
  UserButton: UserButtonMock,
}))

function renderHeader(initialEntries: string[] = ['/']) {
  return render(
    <ThemeModeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Header />
        <Routes>
          <Route path="/settings" element={<div>Settings Page</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeModeProvider>,
  )
}

describe('Header', () => {
  it('shows the app name', () => {
    renderHeader()

    expect(screen.getByText('ND App')).toBeInTheDocument()
  })

  it('shows the account menu, with a Settings item in it, when signed in', () => {
    renderHeader()

    expect(screen.getByRole('button', { name: 'account menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('navigates to Settings from the account menu item', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(await screen.findByText('Settings Page')).toBeInTheDocument()
  })
})
