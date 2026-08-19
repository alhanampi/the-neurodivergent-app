import { describe, expect, it } from 'vitest'
import { parseCreateTimerSessionBody, parseDateRangeQuery } from './timer-sessions.utils.js'

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
    expect(parseCreateTimerSessionBody(validBody)).toEqual({
      ...validBody,
      label: null,
      taskId: null,
      subtaskId: null,
      taskLabel: null,
    })
  })

  it('accepts a session linked to a Task, with a label', () => {
    const body = { ...validBody, taskId: 7, taskLabel: 'Clean the kitchen' }
    expect(parseCreateTimerSessionBody(body)).toEqual({
      ...validBody,
      label: null,
      taskId: 7,
      subtaskId: null,
      taskLabel: 'Clean the kitchen',
    })
  })

  it('accepts a session linked to a Subtask, carrying its parent taskId too', () => {
    const body = { ...validBody, taskId: 7, subtaskId: 12, taskLabel: 'Wash the dishes' }
    expect(parseCreateTimerSessionBody(body)).toEqual({
      ...validBody,
      label: null,
      taskId: 7,
      subtaskId: 12,
      taskLabel: 'Wash the dishes',
    })
  })

  it('rejects a subtaskId with no taskId', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, subtaskId: 12, taskLabel: 'x' })).toBeNull()
  })

  it('rejects a taskId with no label', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, taskId: 7 })).toBeNull()
  })

  it('rejects a non-positive or non-integer taskId', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, taskId: 0, taskLabel: 'x' })).toBeNull()
    expect(parseCreateTimerSessionBody({ ...validBody, taskId: 1.5, taskLabel: 'x' })).toBeNull()
  })

  it('rejects an empty or overlong taskLabel', () => {
    expect(parseCreateTimerSessionBody({ ...validBody, taskId: 7, taskLabel: '   ' })).toBeNull()
    expect(
      parseCreateTimerSessionBody({ ...validBody, taskId: 7, taskLabel: 'x'.repeat(200) }),
    ).toBeNull()
  })

  it('accepts a custom session with a label', () => {
    const body = { ...validBody, presetId: 'custom', label: 'Fold laundry' }
    expect(parseCreateTimerSessionBody(body)).toEqual({
      ...body,
      taskId: null,
      subtaskId: null,
      taskLabel: null,
    })
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

describe('parseDateRangeQuery', () => {
  it('returns undefined when neither startDate nor endDate is given (the Timers tab call)', () => {
    expect(parseDateRangeQuery({})).toBeUndefined()
  })

  it('parses a well-formed range', () => {
    const result = parseDateRangeQuery({
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-18T23:59:59.999Z',
    })
    expect(result).toEqual({
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-18T23:59:59.999Z'),
    })
  })

  it('takes the first value when a query param repeats', () => {
    const result = parseDateRangeQuery({
      startDate: ['2026-08-01T00:00:00.000Z', '2026-08-02T00:00:00.000Z'],
      endDate: '2026-08-18T23:59:59.999Z',
    })
    expect(result?.startDate).toEqual(new Date('2026-08-01T00:00:00.000Z'))
  })

  it('rejects only one of the two bounds being given', () => {
    expect(parseDateRangeQuery({ startDate: '2026-08-01T00:00:00.000Z' })).toBeNull()
    expect(parseDateRangeQuery({ endDate: '2026-08-01T00:00:00.000Z' })).toBeNull()
  })

  it('rejects an unparsable date', () => {
    expect(
      parseDateRangeQuery({ startDate: 'not-a-date', endDate: '2026-08-18T00:00:00.000Z' }),
    ).toBeNull()
  })

  it('rejects startDate after endDate', () => {
    expect(
      parseDateRangeQuery({
        startDate: '2026-08-18T00:00:00.000Z',
        endDate: '2026-08-01T00:00:00.000Z',
      }),
    ).toBeNull()
  })
})
