import type {
  ChatSseFrame,
  ConversationDateGroup,
  ConversationSummary,
} from './AiChatTab.interfaces'

export function isChatSseFrame(value: unknown): value is ChatSseFrame {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  if (candidate.type === 'token') return typeof candidate.value === 'string'
  if (candidate.type === 'done') {
    return (
      typeof candidate.conversationId === 'number' &&
      typeof candidate.messageId === 'number' &&
      (candidate.title === undefined || typeof candidate.title === 'string')
    )
  }
  if (candidate.type === 'error') return typeof candidate.message === 'string'
  return false
}

/** Splits a growing SSE buffer into complete frames plus whatever's left
 * over (a frame can arrive split across two chunk reads) — a malformed
 * frame is skipped rather than crashing the whole stream. */
export function parseSseChunk(buffer: string): { frames: ChatSseFrame[]; remainder: string } {
  const parts = buffer.split('\n\n')
  const remainder = parts.pop() ?? ''
  const frames: ChatSseFrame[] = []

  for (const part of parts) {
    const line = part.trim()
    if (!line.startsWith('data: ')) continue
    try {
      const parsed: unknown = JSON.parse(line.slice('data: '.length))
      if (isChatSseFrame(parsed)) frames.push(parsed)
    } catch {
      // Malformed frame — skip it rather than crash the stream.
    }
  }

  return { frames, remainder }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Groups conversations by last-activity recency for the sidebar —
 * Today/Yesterday/This week/Older, each group only present if it has
 * entries. `now` is a parameter (not read internally) so this is testable
 * with a fixed reference time, same convention as DashboardTab.utils.ts's
 * getDateRangeBounds. Grouping and ordering are both based on `updatedAt`,
 * not `createdAt` — a conversation reads as recent by last activity. */
export function groupConversationsByDate(
  conversations: ConversationSummary[],
  now: Date,
): ConversationDateGroup[] {
  const todayStart = startOfDay(now)
  const yesterdayStart = new Date(todayStart.getTime() - MS_PER_DAY)
  const weekStart = new Date(todayStart.getTime() - 7 * MS_PER_DAY)

  const today: ConversationSummary[] = []
  const yesterday: ConversationSummary[] = []
  const thisWeek: ConversationSummary[] = []
  const older: ConversationSummary[] = []

  for (const conversation of conversations) {
    const updatedAt = new Date(conversation.updatedAt)
    if (updatedAt >= todayStart) today.push(conversation)
    else if (updatedAt >= yesterdayStart) yesterday.push(conversation)
    else if (updatedAt >= weekStart) thisWeek.push(conversation)
    else older.push(conversation)
  }

  const groups: ConversationDateGroup[] = []
  if (today.length > 0) {
    groups.push({ labelKey: 'chat.sidebar.groups.today', conversations: today })
  }
  if (yesterday.length > 0) {
    groups.push({ labelKey: 'chat.sidebar.groups.yesterday', conversations: yesterday })
  }
  if (thisWeek.length > 0) {
    groups.push({ labelKey: 'chat.sidebar.groups.thisWeek', conversations: thisWeek })
  }
  if (older.length > 0) {
    groups.push({ labelKey: 'chat.sidebar.groups.older', conversations: older })
  }

  return groups
}

export function formatConversationTimestamp(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

/** A short client-only id for a PlanStepDraft (React keys/editing) — never
 * persisted, same collision-resistance need as TimersTab.utils.ts's
 * createTimerId (one tab's lifetime), duplicated rather than imported
 * across feature folders for a five-line helper. */
export function createDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
