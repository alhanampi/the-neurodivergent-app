import { FiClock, FiMessageCircle, FiBarChart2 } from 'react-icons/fi'
import type { TabConfig } from './AppLayout.interfaces'

// Settings isn't a bottom-nav tab anymore — it moved to the header (avatar +
// gear icon, always visible). See src/app/Header.
export const TABS: TabConfig[] = [
  { id: 'timers', path: '/', labelKey: 'nav.timers', icon: FiClock },
  { id: 'ai-chat', path: '/chat', labelKey: 'nav.chat', icon: FiMessageCircle },
  { id: 'dashboard', path: '/dashboard', labelKey: 'nav.dashboard', icon: FiBarChart2 },
]
