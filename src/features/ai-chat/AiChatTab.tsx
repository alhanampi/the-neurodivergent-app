import { FiMessageCircle } from 'react-icons/fi'
import { ComingSoonPlaceholder } from '@/components/ComingSoonPlaceholder/ComingSoonPlaceholder'

// TODO(iteration/08-ai-chat-tab, v0.9.0): replace with the real AI chat —
// Groq-backed, task-breakdown system prompt, "send plan to Timers" handoff.
export function AiChatTab() {
  return (
    <ComingSoonPlaceholder
      title="AI Chat"
      description="Talk through a task and break it into small, doable steps. Coming in a future iteration."
      icon={FiMessageCircle}
    />
  )
}
