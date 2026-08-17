import { FiSettings } from 'react-icons/fi'
import { ComingSoonPlaceholder } from '@/components/ComingSoonPlaceholder/ComingSoonPlaceholder'

// TODO(iteration/05-settings-tab, v0.6.0): replace with the real Settings tab
// — language, theme, account (Clerk), sign out, delete account.
export function SettingsTab() {
  return (
    <ComingSoonPlaceholder
      title="Settings"
      description="Language, theme, and account preferences will live here. Coming in a future iteration."
      icon={FiSettings}
    />
  )
}
