import { useTranslation } from 'react-i18next'
import { FiClock } from 'react-icons/fi'
import { ComingSoonPlaceholder } from '@/components/ComingSoonPlaceholder/ComingSoonPlaceholder'

// TODO(iteration/06-timers-tab, v0.7.0): replace with the real timer/pomodoro
// feature — presets, manual start/stop tracking, notifications, history.
export function TimersTab() {
  const { t } = useTranslation()
  return (
    <ComingSoonPlaceholder
      title={t('comingSoon.timers.title')}
      description={t('comingSoon.timers.description')}
      icon={FiClock}
    />
  )
}
