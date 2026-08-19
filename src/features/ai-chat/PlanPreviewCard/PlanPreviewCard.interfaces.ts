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
  isSending: boolean
}
