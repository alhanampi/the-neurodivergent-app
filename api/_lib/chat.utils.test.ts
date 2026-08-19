import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, deriveConversationTitle, parseChatRequestBody } from './chat.utils.js'

describe('parseChatRequestBody', () => {
  const valid = { conversationId: null, message: 'Help me clean the kitchen', language: 'en' }

  it('accepts a well-formed new-conversation request', () => {
    expect(parseChatRequestBody(valid)).toEqual(valid)
  })

  it('accepts an existing conversation id', () => {
    const body = { ...valid, conversationId: 42 }
    expect(parseChatRequestBody(body)).toEqual(body)
  })

  it('trims the message', () => {
    const result = parseChatRequestBody({ ...valid, message: '  hello  ' })
    expect(result?.message).toBe('hello')
  })

  it('rejects a non-positive or non-integer conversationId', () => {
    expect(parseChatRequestBody({ ...valid, conversationId: 0 })).toBeNull()
    expect(parseChatRequestBody({ ...valid, conversationId: -1 })).toBeNull()
    expect(parseChatRequestBody({ ...valid, conversationId: 1.5 })).toBeNull()
    expect(parseChatRequestBody({ ...valid, conversationId: 'abc' })).toBeNull()
  })

  it('rejects an empty or whitespace-only message', () => {
    expect(parseChatRequestBody({ ...valid, message: '' })).toBeNull()
    expect(parseChatRequestBody({ ...valid, message: '   ' })).toBeNull()
  })

  it('rejects a message past the sanity ceiling', () => {
    expect(parseChatRequestBody({ ...valid, message: 'x'.repeat(4001) })).toBeNull()
  })

  it('rejects an unsupported language', () => {
    expect(parseChatRequestBody({ ...valid, language: 'fr' })).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseChatRequestBody(null)).toBeNull()
    expect(parseChatRequestBody('nope')).toBeNull()
    expect(parseChatRequestBody(undefined)).toBeNull()
  })
})

describe('deriveConversationTitle', () => {
  it('returns a short message as-is', () => {
    expect(deriveConversationTitle('Clean the kitchen')).toBe('Clean the kitchen')
  })

  it('trims and collapses internal whitespace', () => {
    expect(deriveConversationTitle('  Clean   the   kitchen  ')).toBe('Clean the kitchen')
  })

  it('truncates a long message with an ellipsis', () => {
    const long = 'a'.repeat(80)
    const result = deriveConversationTitle(long)
    expect(result).toHaveLength(49) // 48 chars + ellipsis
    expect(result.endsWith('…')).toBe(true)
  })

  it('falls back to a generic title for an empty message', () => {
    expect(deriveConversationTitle('   ')).toBe('New conversation')
  })
})

describe('buildSystemPrompt', () => {
  it('instructs the model to answer in English', () => {
    expect(buildSystemPrompt('en')).toContain('Respond only in English')
  })

  it('instructs the model to answer in Spanish', () => {
    expect(buildSystemPrompt('es')).toContain('Respond only in Spanish')
  })

  it('encodes the required persona', () => {
    const prompt = buildSystemPrompt('en')
    expect(prompt).toContain('warm')
    expect(prompt).toContain('clarifying questions')
    expect(prompt).toContain('Never scold')
  })

  it('instructs the model to sanity-check a stated time budget against the task', () => {
    const prompt = buildSystemPrompt('en')
    expect(prompt).toContain('sanity-check')
    expect(prompt).toContain('REAL time')
  })

  it('gives a concrete distance-based time-estimation example', () => {
    const prompt = buildSystemPrompt('en')
    expect(prompt).toContain('2 minutes per city block')
    expect(prompt).toContain('round trip')
  })
})
