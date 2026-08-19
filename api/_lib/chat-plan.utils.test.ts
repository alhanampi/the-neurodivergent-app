import { describe, expect, it } from 'vitest'
import {
  buildPlanSystemPrompt,
  parseChatPlanRequestBody,
  parsePlanResponse,
} from './chat-plan.utils.js'

describe('parseChatPlanRequestBody', () => {
  it('accepts a well-formed request', () => {
    expect(parseChatPlanRequestBody({ conversationId: 1, language: 'en' })).toEqual({
      conversationId: 1,
      language: 'en',
    })
  })

  it('rejects a non-positive or non-integer conversationId', () => {
    expect(parseChatPlanRequestBody({ conversationId: 0, language: 'en' })).toBeNull()
    expect(parseChatPlanRequestBody({ conversationId: 1.5, language: 'en' })).toBeNull()
  })

  it('rejects an unsupported language', () => {
    expect(parseChatPlanRequestBody({ conversationId: 1, language: 'fr' })).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseChatPlanRequestBody(null)).toBeNull()
  })
})

describe('buildPlanSystemPrompt', () => {
  it('asks for JSON-only output in the given language', () => {
    const prompt = buildPlanSystemPrompt('es')
    expect(prompt).toContain('Spanish')
    expect(prompt).toContain('JSON')
  })
})

describe('parsePlanResponse', () => {
  it('parses a well-formed response', () => {
    const raw = JSON.stringify({ steps: [{ title: 'Wash dishes', minutes: 10 }] })
    expect(parsePlanResponse(raw)).toEqual({ steps: [{ title: 'Wash dishes', minutes: 10 }] })
  })

  it('rounds a non-integer minutes value', () => {
    const raw = JSON.stringify({ steps: [{ title: 'Step', minutes: 10.6 }] })
    expect(parsePlanResponse(raw)?.steps[0].minutes).toBe(11)
  })

  it('rejects malformed JSON', () => {
    expect(parsePlanResponse('not json')).toBeNull()
  })

  it('rejects a missing steps array', () => {
    expect(parsePlanResponse(JSON.stringify({}))).toBeNull()
  })

  it('rejects an empty steps array', () => {
    expect(parsePlanResponse(JSON.stringify({ steps: [] }))).toBeNull()
  })

  it('rejects more than 12 steps', () => {
    const steps = Array.from({ length: 13 }, (_, i) => ({ title: `Step ${i}`, minutes: 5 }))
    expect(parsePlanResponse(JSON.stringify({ steps }))).toBeNull()
  })

  it('rejects an out-of-range minutes value', () => {
    expect(parsePlanResponse(JSON.stringify({ steps: [{ title: 'Step', minutes: 0 }] }))).toBeNull()
    expect(
      parsePlanResponse(JSON.stringify({ steps: [{ title: 'Step', minutes: 181 }] })),
    ).toBeNull()
  })

  it('rejects a step title over 120 characters', () => {
    expect(
      parsePlanResponse(JSON.stringify({ steps: [{ title: 'x'.repeat(121), minutes: 5 }] })),
    ).toBeNull()
  })

  it('rejects a non-string title or non-number minutes', () => {
    expect(parsePlanResponse(JSON.stringify({ steps: [{ title: 42, minutes: 5 }] }))).toBeNull()
    expect(
      parsePlanResponse(JSON.stringify({ steps: [{ title: 'Step', minutes: 'five' }] })),
    ).toBeNull()
  })
})
