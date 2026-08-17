import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { AuthGate } from '@/auth/AuthGate/AuthGate'
import { AppLayout } from './AppLayout/AppLayout'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!clerkPublishableKey) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY — copy .env.example to .env.local and fill it in.',
  )
}

// Root component: only wires up top-level providers. Everything else lives in
// AppLayout and below.
export function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <BrowserRouter>
        <AuthGate>
          <AppLayout />
        </AuthGate>
      </BrowserRouter>
    </ClerkProvider>
  )
}
