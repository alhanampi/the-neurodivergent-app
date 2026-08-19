import type { SubtaskRecord, TaskPriority } from '../TasksTab.interfaces'

export interface SubtaskRowProps {
  subtask: SubtaskRecord
  isExpanded: boolean
  onToggleExpand: (subtaskId: number) => void
  onToggleCompleted: (subtaskId: number) => void
  onDelete: (subtaskId: number) => void
  onPause: (subtaskId: number) => void
  onResume: (subtaskId: number) => void
  onAddMinutes: (subtaskId: number, minutes: number) => void
  onSubtractMinutes: (subtaskId: number, minutes: number) => void
  onPriorityChange: (subtaskId: number, priority: TaskPriority) => void
  onDueDateChange: (subtaskId: number, dueDate: string | null) => void
}
