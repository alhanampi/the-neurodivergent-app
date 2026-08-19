import { LAST_CONVERSATION_STORAGE_KEY } from './AiChatTab.constants'
import type {
  ChatSseFrame,
  ConversationDateGroup,
  ConversationSummary,
} from './AiChatTab.interfaces'
import {
  DEFAULT_POMODORO_BREAK_MINUTES,
  DEFAULT_POMODORO_FOCUS_MINUTES,
} from '@/features/timers/TimersTab.constants'

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

/** Reads the last active conversation id remembered across a tab switch
 * (see LAST_CONVERSATION_STORAGE_KEY) — null if there isn't one, or it's
 * not a valid positive integer (a hand-edited/corrupted value shouldn't
 * crash the restore, just be treated as absent). */
export function getStoredConversationId(): number | null {
  const raw = localStorage.getItem(LAST_CONVERSATION_STORAGE_KEY)
  if (raw === null) return null
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function setStoredConversationId(conversationId: number | null): void {
  if (conversationId === null) {
    localStorage.removeItem(LAST_CONVERSATION_STORAGE_KEY)
  } else {
    localStorage.setItem(LAST_CONVERSATION_STORAGE_KEY, String(conversationId))
  }
}

/** Expresses a plan step's estimated minutes as a rough Pomodoro-shaped
 * breakdown (block count + the app's standard focus/break split, reused
 * from the Timers tab's own defaults) instead of a bare minute count — see
 * ROADMAP.md's "Timers tab rethink" note. A pure *display* helper: the
 * step's stored `minutes` stays the source of truth, this is recomputed
 * fresh every render, nothing about the breakdown itself is persisted. */
export function estimatePomodoroBreakdown(minutes: number): {
  blocks: number
  focusMinutes: number
  breakMinutes: number
} {
  const blocks = Math.max(1, Math.round(minutes / DEFAULT_POMODORO_FOCUS_MINUTES))
  return {
    blocks,
    focusMinutes: DEFAULT_POMODORO_FOCUS_MINUTES,
    breakMinutes: DEFAULT_POMODORO_BREAK_MINUTES,
  }
}
