import { ClerkProvider } from '@clerk/clerk-react'
// Subpath imports (not the '@clerk/localizations' barrel) so we only ship
// the two locales we use — the barrel pulls in every locale Clerk ships,
// which bloated the bundle by ~170kB gzipped for locales we'd never render.
import { enUS } from '@clerk/localizations/en-US'
import { esES } from '@clerk/localizations/es-ES'
import { useTranslation } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import { AuthGate } from '@/auth/AuthGate/AuthGate'
import { AppLayout } from './AppLayout/AppLayout'
import { Header } from './Header/Header'
import { SkipLink } from './SkipLink/SkipLink'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!clerkPublishableKey) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY — copy .env.example to .env.local and fill it in.',
  )
}

// Keeps Clerk's own UI (sign-in, the account management modal) in the same
// language as the rest of the app, instead of leaving it stuck in English.
const CLERK_LOCALIZATIONS = { en: enUS, es: esES }

// Root component: only wires up top-level providers. Everything else lives in
// AppLayout and below.
export function App() {
  const { i18n } = useTranslation()
  const clerkLocalization =
    CLERK_LOCALIZATIONS[i18n.language as keyof typeof CLERK_LOCALIZATIONS] ?? enUS

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} localization={clerkLocalization}>
      <BrowserRouter>
        {/* Must come before Header in the DOM — it's only useful as the
            very first focusable element on the page. */}
        <SkipLink />
        {/* Header is rendered above both branches of AuthGate, so the app's
            identity (and, once signed in, account/Settings access) stays in
            the same place whether you're signed in or looking at SignIn. */}
        <Header />
        <AuthGate>
          <AppLayout />
        </AuthGate>
      </BrowserRouter>
    </ClerkProvider>
  )
}
