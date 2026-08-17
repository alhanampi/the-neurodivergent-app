import { FiBarChart2 } from 'react-icons/fi'
import { ComingSoonPlaceholder } from '@/components/ComingSoonPlaceholder/ComingSoonPlaceholder'

// TODO(iteration/07-dashboard-tab, v0.8.0): replace with real stats — charts
// of completed tasks and time from timer history, date-range filters.
export function DashboardTab() {
  return (
    <ComingSoonPlaceholder
      title="Dashboard"
      description="See your completed tasks, time spent, and progress over time. Coming in a future iteration."
      icon={FiBarChart2}
    />
  )
}
