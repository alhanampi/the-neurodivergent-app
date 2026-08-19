import type { IconType } from 'react-icons'

// 'settings' isn't in TABS (AppLayout.constants.ts) anymore — kept here since
// it's still a real section of the app, just reached from the header now.
export type TabId = 'timers' | 'ai-chat' | 'tasks' | 'dashboard' | 'settings'

export interface TabConfig {
  id: TabId
  path: string
  /** i18n key (namespace "common") for the tab's nav label. */
  labelKey: string
  icon: IconType
}

export type TranslatedTabConfig = TabConfig & { label: string }
