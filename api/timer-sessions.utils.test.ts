import { describe, expect, it } from 'vitest'
import { parseCreateTimerSessionBody } from './timer-sessions.utils'

const validBody = {
  presetId: 'pomodoro-focus',
  plannedSeconds: 1500,
  actualSeconds: 1500,
  completed: true,
  startedAt: '2026-08-18T10:00:00.000Z',
  endedAt: '2026-08-18T10:25:00.000Z',
}

describe('parseCreateTimerSessionBody', () => {
  it('accepts a well-formed preset session', () => {
    expect(parseCreateTimerSessionBody(validBody)).toEqual({ ...validBody, label: null })
  })

  it('accepts a custom session with a label', () => {
    const body = { ...validBody, presetId: 'custom', label: 'Fold laundry' }
    expect(parseCreateTimerSessionBody(body)).toEqual(body)
  })

  it('rejects an unknown presetId', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, presetId: 'made-up' })).toBeNull()
  })

  it('rejects non-positive or non-integer durations', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, plannedSeconds: 0 })).toBeNull()
    expect(parseCreateTimerSessionBody({ ...validBody, actualSeconds: -5 })).toBeNull()
    expect(parseCreateTimerSessionBody({ ...validBody, plannedSeconds: 12.5 })).toBeNull()
  })

  it('rejects durations past the sanity ceiling', () => {
    expect(
      parseCreateTimerSessionBody({ ...validBody, plannedSeconds: 24 * 60 * 60 + 1 }),
    ).toBeNull()
  })

  it('rejects a non-boolean completed flag', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, completed: 'yes' })).toBeNull()
  })

  it('rejects invalid dates', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, startedAt: 'not-a-date' })).toBeNull()
  })

  it('rejects endedAt before startedAt', () => {
    expect(
      parseCreateTimerSessionBody({
        ...validBody,
        startedAt: '2026-08-18T10:25:00.000Z',
        endedAt: '2026-08-18T10:00:00.000Z',
      }),
    ).toBeNull()
  })

  it('rejects a non-string label', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, label: 42 })).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseCreateTimerSessionBody(null)).toBeNull()
    expect(parseCreateTimerSessionBody('nope')).toBeNull()
    expect(parseCreateTimerSessionBody(undefined)).toBeNull()
  })
})
