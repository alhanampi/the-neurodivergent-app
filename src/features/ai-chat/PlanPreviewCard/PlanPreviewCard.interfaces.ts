import type { PlanStepDraft } from '../AiChatTab.interfaces'

export interface PlanPreviewCardProps {
  taskTitle: string
  onTaskTitleChange: (title: string) => void
  taskDescription: string
  onTaskDescriptionChange: (description: string) => void
  steps: PlanStepDraft[]
  onTitleChange: (id: string, title: string) => void
  onMinutesChange: (id: string, minutes: number) => void
  onRemoveStep: (id: string) => void
  onDiscard: () => void
  onConfirm: () => void
  /** "Start a Pomodoro now" (see ROADMAP.md's "Timers tab rethink" note) —
   * navigates straight to the Timers tab with a Pomodoro pre-filled from
   * the first step, creating no Task/Subtask rows at all. A second, distinct
   * action from onConfirm ("Send to Tasks"), not a replacement for it. */
  onStartPomodoro: () => void
  isSending: boolean
}
