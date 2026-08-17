import { FiClock, FiMessageCircle, FiBarChart2, FiSettings } from 'react-icons/fi'
import type { TabConfig } from './AppShell.interfaces'

export const TABS: TabConfig[] = [
  { id: 'timers', path: '/', labelKey: 'nav.timers', icon: FiClock },
  { id: 'ai-chat', path: '/chat', labelKey: 'nav.chat', icon: FiMessageCircle },
  { id: 'dashboard', path: '/dashboard', labelKey: 'nav.dashboard', icon: FiBarChart2 },
  { id: 'settings', path: '/settings', labelKey: 'nav.settings', icon: FiSettings },
]
