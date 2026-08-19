import type { ConversationDateGroup } from '../AiChatTab.interfaces'

export interface ConversationSidebarProps {
  open: boolean
  onClose: () => void
  groups: ConversationDateGroup[]
  activeConversationId: number | null
  isLoading: boolean
  onSelectConversation: (id: number) => void
  onNewChat: () => void
  onRenameConversation: (id: number, title: string) => void
  /** Delete-confirmation state lives in useAiChatTab (mirrors useTimersTab's
   * pendingStopId) — this component only owns the transient rename-in-place
   * UI state (see useConversationSidebar). */
  pendingDeleteId: number | null
  pendingDeleteTitle: string | null
  onRequestDelete: (id: number) => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}
