import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'

/**
 * Owns the actual deletion: calling it fires Clerk's user.delete(), which
 * also triggers our webhook (api/webhooks/clerk.ts) to cascade-delete the
 * user's row in Neon. AuthGate switches back to SignInScreen on its own once
 * the user is signed out — no manual redirect needed here.
 */
export function useDeleteAccountDialog() {
  const { user } = useUser()
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleConfirmDelete = async () => {
    if (!user) return

    setIsDeleting(true)
    setHasError(false)
    try {
      await user.delete()
    } catch {
      setHasError(true)
      setIsDeleting(false)
    }
  }

  return { isDeleting, hasError, handleConfirmDelete }
}
