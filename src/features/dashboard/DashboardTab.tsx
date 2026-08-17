import { useTranslation } from 'react-i18next'
import { FiBarChart2 } from 'react-icons/fi'
import { ComingSoonPlaceholder } from '@/components/ComingSoonPlaceholder/ComingSoonPlaceholder'

// TODO(iteration/07-dashboard-tab, v0.8.0): replace with real stats — charts
// of completed tasks and time from timer history, date-range filters.
export function DashboardTab() {
  const { t } = useTranslation()
  return (
    <ComingSoonPlaceholder
      title={t('comingSoon.dashboard.title')}
      description={t('comingSoon.dashboard.description')}
      icon={FiBarChart2}
    />
  )
}
