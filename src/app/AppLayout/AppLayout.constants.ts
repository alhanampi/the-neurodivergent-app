import { FiBarChart2, FiCheckSquare, FiClock, FiMessageCircle } from 'react-icons/fi'
import type { TabConfig } from './AppLayout.interfaces'

// Settings isn't a bottom-nav tab anymore — it moved to the header (avatar +
// gear icon, always visible). See src/app/Header.
//
// 'tasks' (iteration 8) is a deliberate deviation from the "3 tabs since
// iteration 5" precedent — added because the user explicitly asked for a
// checklist view of an approved AI Chat plan, separate from Timers, with no
// timer pressure attached. Low risk: NavAction (AppLayout.styles.ts) was
// already sized to handle 4 tabs without overflowing on narrow phones (true
// before Settings moved to the header). Placed right after 'ai-chat', its
// source, with 'dashboard' staying last as the review tab.
export const TABS: TabConfig[] = [
  { id: 'timers', path: '/', labelKey: 'nav.timers', icon: FiClock },
  { id: 'ai-chat', path: '/chat', labelKey: 'nav.chat', icon: FiMessageCircle },
  { id: 'tasks', path: '/tasks', labelKey: 'nav.tasks', icon: FiCheckSquare },
  { id: 'dashboard', path: '/dashboard', labelKey: 'nav.dashboard', icon: FiBarChart2 },
]
