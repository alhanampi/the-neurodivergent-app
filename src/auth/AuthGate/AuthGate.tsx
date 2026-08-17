import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/clerk-react'
import CircularProgress from '@mui/material/CircularProgress'
import { SignInScreen } from '../SignInScreen/SignInScreen'
import { LoadingContainer } from './AuthGate.styles'
import type { AuthGateProps } from './AuthGate.interfaces'

// Gates the whole app behind Clerk: signed-out users see SignInScreen
// instead of `children`. Every screen in this app is personal, so there's
// no "public route" case to carve out — this one gate covers all of it.
export function AuthGate({ children }: AuthGateProps) {
  return (
    <>
      <ClerkLoading>
        <LoadingContainer>
          <CircularProgress />
        </LoadingContainer>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>{children}</SignedIn>
        <SignedOut>
          <SignInScreen />
        </SignedOut>
      </ClerkLoaded>
    </>
  )
}
