import { FiClock } from 'react-icons/fi'
import { ComingSoonPlaceholder } from '@/components/ComingSoonPlaceholder/ComingSoonPlaceholder'

// TODO(iteration/06-timers-tab, v0.7.0): replace with the real timer/pomodoro
// feature — presets, manual start/stop tracking, notifications, history.
export function TimersTab() {
  return (
    <ComingSoonPlaceholder
      title="Timers"
      description="Set a timer, run a pomodoro, or track a task as you go. Coming in a future iteration."
      icon={FiClock}
    />
  )
}
