import type { ChatMessageRole } from '../AiChatTab.interfaces'

export interface MessageBubbleProps {
  role: ChatMessageRole
  content: string
}
