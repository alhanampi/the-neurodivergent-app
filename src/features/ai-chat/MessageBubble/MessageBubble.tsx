import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bubble, BubbleRow } from './MessageBubble.styles'
import type { MessageBubbleProps } from './MessageBubble.interfaces'

// User messages render as plain text — nothing to render, and it avoids a
// user's own literal asterisks/underscores being reinterpreted as markdown
// formatting. Assistant messages render through react-markdown so
// step-by-step lists/bold read naturally instead of as raw ** and -.
export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <BubbleRow $isUser={isUser}>
      <Bubble $isUser={isUser}>
        {isUser ? content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>}
      </Bubble>
    </BubbleRow>
  )
}
