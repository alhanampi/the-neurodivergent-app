import type { IconType } from 'react-icons'

export type TabId = 'timers' | 'ai-chat' | 'dashboard' | 'settings'

export interface TabConfig {
  id: TabId
  path: string
  /** i18n key (namespace "common") for the tab's nav label. */
  labelKey: string
  icon: IconType
}

export type TranslatedTabConfig = TabConfig & { label: string }
