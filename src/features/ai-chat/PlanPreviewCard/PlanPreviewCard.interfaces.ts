import type { PlanStepDraft } from '../AiChatTab.interfaces'

export interface PlanPreviewCardProps {
  steps: PlanStepDraft[]
  onTitleChange: (id: string, title: string) => void
  onMinutesChange: (id: string, minutes: number) => void
  onRemoveStep: (id: string) => void
  onDiscard: () => void
  onConfirm: () => void
  isSending: boolean
}
