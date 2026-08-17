import { useTranslation } from 'react-i18next'
import { FiMessageCircle } from 'react-icons/fi'
import { ComingSoonPlaceholder } from '@/components/ComingSoonPlaceholder/ComingSoonPlaceholder'

// TODO(iteration/08-ai-chat-tab, v0.9.0): replace with the real AI chat —
// Groq-backed, task-breakdown system prompt, "send plan to Timers" handoff.
export function AiChatTab() {
  const { t } = useTranslation()
  return (
    <ComingSoonPlaceholder
      title={t('comingSoon.chat.title')}
      description={t('comingSoon.chat.description')}
      icon={FiMessageCircle}
    />
  )
}
