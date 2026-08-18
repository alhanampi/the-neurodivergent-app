import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { Header } from './Header'

vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }: { children: ReactNode }) => children,
  UserButton: () => <button aria-label="account menu">avatar</button>,
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

  it('shows the account menu and Settings shortcut when signed in', () => {
    renderHeader()

    expect(screen.getByRole('button', { name: 'account menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('navigates to Settings when the gear icon is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(await screen.findByText('Settings Page')).toBeInTheDocument()
  })
})
