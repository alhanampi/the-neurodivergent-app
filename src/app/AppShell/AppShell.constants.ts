import { FiClock, FiMessageCircle, FiBarChart2, FiSettings } from 'react-icons/fi'
import type { TabConfig } from './AppShell.interfaces'

export const TABS: TabConfig[] = [
  { id: 'timers', path: '/', label: 'Timers', icon: FiClock },
  { id: 'ai-chat', path: '/chat', label: 'AI Chat', icon: FiMessageCircle },
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { id: 'settings', path: '/settings', label: 'Settings', icon: FiSettings },
]
