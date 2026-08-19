import { useTranslation } from 'react-i18next'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { TASK_PRIORITIES } from '../TasksTab.constants'
import type { TaskPriority } from '../TasksTab.interfaces'
import type { PriorityControlProps } from './PriorityControl.interfaces'

// Shared by AddTaskDialog, AddSubtaskDialog, and TaskCard/SubtaskRow's
// inline priority editors — same ToggleButtonGroup pattern the app already
// uses for the Timers tab's preset selector and the Dashboard's date-range
// presets.
export function PriorityControl({ value, onChange, size = 'small' }: PriorityControlProps) {
  const { t } = useTranslation()

  return (
    <ToggleButtonGroup
      size={size}
      exclusive
      value={value}
      onChange={(_event, next: TaskPriority | null) => {
        if (next) onChange(next)
      }}
      aria-label={t('tasks.priority.label')}
    >
      {TASK_PRIORITIES.map((priority) => (
        <ToggleButton key={priority} value={priority}>
          {t(`tasks.priority.${priority}`)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
