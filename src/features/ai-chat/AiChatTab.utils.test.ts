import { describe, expect, it } from 'vitest'
import {
  formatConversationTimestamp,
  groupConversationsByDate,
  isChatSseFrame,
  parseSseChunk,
} from './AiChatTab.utils'
import type { ConversationSummary } from './AiChatTab.interfaces'

describe('isChatSseFrame', () => {
  it('accepts a valid token frame', () => {
    expect(isChatSseFrame({ type: 'token', value: 'hi' })).toBe(true)
  })

  it('accepts a valid done frame, with or without title', () => {
    expect(isChatSseFrame({ type: 'done', conversationId: 1, messageId: 2 })).toBe(true)
    expect(
      isChatSseFrame({ type: 'done', conversationId: 1, messageId: 2, title: 'New chat' }),
    ).toBe(true)
  })

  it('accepts a valid error frame', () => {
    expect(isChatSseFrame({ type: 'error', message: 'oops' })).toBe(true)
  })

  it('rejects a frame missing required fields', () => {
    expect(isChatSseFrame({ type: 'token' })).toBe(false)
    expect(isChatSseFrame({ type: 'done', conversationId: 1 })).toBe(false)
  })

  it('rejects an unknown type or non-object input', () => {
    expect(isChatSseFrame({ type: 'unknown' })).toBe(false)
    expect(isChatSseFrame(null)).toBe(false)
    expect(isChatSseFrame('nope')).toBe(false)
  })
})

describe('parseSseChunk', () => {
  it('parses a single complete frame', () => {
    const { frames, remainder } = parseSseChunk('data: {"type":"token","value":"hi"}\n\n')
    expect(frames).toEqual([{ type: 'token', value: 'hi' }])
    expect(remainder).toBe('')
  })

  it('parses multiple frames in one chunk', () => {
    const buffer = 'data: {"type":"token","value":"a"}\n\ndata: {"type":"token","value":"b"}\n\n'
    const { frames } = parseSseChunk(buffer)
    expect(frames).toEqual([
      { type: 'token', value: 'a' },
      { type: 'token', value: 'b' },
    ])
  })

  it('carries a frame split across two chunks over in the remainder', () => {
    const first = parseSseChunk('data: {"type":"token","va')
    expect(first.frames).toEqual([])
    expect(first.remainder).toBe('data: {"type":"token","va')

    const second = parseSseChunk(`${first.remainder}lue":"hi"}\n\n`)
    expect(second.frames).toEqual([{ type: 'token', value: 'hi' }])
  })

  it('skips a malformed frame without throwing', () => {
    const buffer = 'data: not-json\n\ndata: {"type":"token","value":"ok"}\n\n'
    const { frames } = parseSseChunk(buffer)
    expect(frames).toEqual([{ type: 'token', value: 'ok' }])
  })

  it('ignores lines that are not data: frames', () => {
    const { frames } = parseSseChunk(': keep-alive comment\n\n')
    expect(frames).toEqual([])
  })
})

function localIso(y: number, m: number, d: number, h = 12): string {
  return new Date(y, m, d, h).toISOString()
}

function conversation(id: number, updatedAt: string): ConversationSummary {
  return { id, title: `Conversation ${id}`, createdAt: updatedAt, updatedAt, messageCount: 2 }
}

describe('groupConversationsByDate', () => {
  const now = new Date(2026, 7, 18, 15, 0) // Aug 18, 2026, 15:00 local

  it('groups a conversation updated today', () => {
    const groups = groupConversationsByDate([conversation(1, localIso(2026, 7, 18, 9))], now)
    expect(groups).toEqual([
      {
        labelKey: 'chat.sidebar.groups.today',
        conversations: [conversation(1, localIso(2026, 7, 18, 9))],
      },
    ])
  })

  it('groups a conversation updated yesterday', () => {
    const groups = groupConversationsByDate([conversation(1, localIso(2026, 7, 17, 9))], now)
    expect(groups[0].labelKey).toBe('chat.sidebar.groups.yesterday')
  })

  it('groups a conversation updated 3 days ago as this week', () => {
    const groups = groupConversationsByDate([conversation(1, localIso(2026, 7, 15, 9))], now)
    expect(groups[0].labelKey).toBe('chat.sidebar.groups.thisWeek')
  })

  it('groups a conversation updated over a week ago as older', () => {
    const groups = groupConversationsByDate([conversation(1, localIso(2026, 7, 1, 9))], now)
    expect(groups[0].labelKey).toBe('chat.sidebar.groups.older')
  })

  it('omits empty groups and preserves today/yesterday/thisWeek/older order', () => {
    const groups = groupConversationsByDate(
      [conversation(1, localIso(2026, 7, 18, 9)), conversation(2, localIso(2026, 7, 1, 9))],
      now,
    )
    expect(groups.map((g) => g.labelKey)).toEqual([
      'chat.sidebar.groups.today',
      'chat.sidebar.groups.older',
    ])
  })

  it('returns an empty array for no conversations', () => {
    expect(groupConversationsByDate([], now)).toEqual([])
  })
})

describe('formatConversationTimestamp', () => {
  it('formats a valid ISO date without throwing', () => {
    const result = formatConversationTimestamp('2026-08-18T10:00:00.000Z', 'en')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
