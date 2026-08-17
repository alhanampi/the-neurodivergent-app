import type { IconType } from 'react-icons'

export type TabId = 'timers' | 'ai-chat' | 'dashboard' | 'settings'

export interface TabConfig {
  id: TabId
  path: string
  // TODO(iteration 2 — i18n-theme): replace this plain-English label with an
  // i18n key once react-i18next is wired up. Hardcoded here only because no
  // i18n system exists yet at this iteration.
  label: string
  icon: IconType
}
