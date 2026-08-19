import type { TaskPriority } from '../TasksTab.interfaces'

export interface PriorityControlProps {
  value: TaskPriority
  onChange: (priority: TaskPriority) => void
  size?: 'small' | 'medium'
}
