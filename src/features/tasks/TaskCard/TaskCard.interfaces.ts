import type { TaskPriority, TaskRecord } from '../TasksTab.interfaces'

export interface TaskCardProps {
  task: TaskRecord
  isExpanded: boolean
  onToggleExpand: (taskId: number) => void
  onDeleteTask: (taskId: number) => void
  onPriorityChange: (taskId: number, priority: TaskPriority) => void
  onDueDateChange: (taskId: number, dueDate: string | null) => void
  onOpenAddSubtask: (taskId: number) => void
  onGoToChat: (task: TaskRecord) => void
  expandedSubtaskId: number | null
  onToggleSubtaskExpand: (subtaskId: number) => void
  onToggleSubtaskCompleted: (subtaskId: number) => void
  onDeleteSubtask: (subtaskId: number) => void
  onPauseSubtaskTimer: (subtaskId: number) => void
  onResumeSubtaskTimer: (subtaskId: number) => void
  onAddSubtaskMinutes: (subtaskId: number, minutes: number) => void
  onSubtractSubtaskMinutes: (subtaskId: number, minutes: number) => void
  onSubtaskPriorityChange: (subtaskId: number, priority: TaskPriority) => void
  onSubtaskDueDateChange: (subtaskId: number, dueDate: string | null) => void
}
