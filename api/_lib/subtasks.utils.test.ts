import { describe, expect, it } from 'vitest'
import { parseCreateSubtaskBody, parseUpdateSubtaskBody } from './subtasks.utils.js'

describe('parseCreateSubtaskBody', () => {
  it('accepts a well-formed body with defaults filled in', () => {
    expect(parseCreateSubtaskBody({ taskId: 1, title: 'Wash dishes', minutes: 10 })).toEqual({
      taskId: 1,
      title: 'Wash dishes',
      minutes: 10,
      priority: 'medium',
      dueDate: null,
    })
  })

  it('trims the title and rounds minutes', () => {
    const result = parseCreateSubtaskBody({ taskId: 1, title: '  Step  ', minutes: 5.6 })
    expect(result).toEqual({
      taskId: 1,
      title: 'Step',
      minutes: 6,
      priority: 'medium',
      dueDate: null,
    })
  })

  it('rejects an invalid taskId', () => {
    expect(parseCreateSubtaskBody({ taskId: 0, title: 'Step', minutes: 5 })).toBeNull()
    expect(parseCreateSubtaskBody({ taskId: 1.5, title: 'Step', minutes: 5 })).toBeNull()
  })

  it('rejects an out-of-range minutes value', () => {
    expect(parseCreateSubtaskBody({ taskId: 1, title: 'Step', minutes: 0 })).toBeNull()
    expect(parseCreateSubtaskBody({ taskId: 1, title: 'Step', minutes: 181 })).toBeNull()
  })

  it('rejects an empty title', () => {
    expect(parseCreateSubtaskBody({ taskId: 1, title: '', minutes: 5 })).toBeNull()
  })

  it('rejects an invalid priority', () => {
    expect(
      parseCreateSubtaskBody({ taskId: 1, title: 'Step', minutes: 5, priority: 'urgent' }),
    ).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseCreateSubtaskBody(null)).toBeNull()
  })
})

describe('parseUpdateSubtaskBody', () => {
  it('accepts a field-only edit', () => {
    expect(parseUpdateSubtaskBody({ completed: true })).toEqual({ completed: true })
    expect(parseUpdateSubtaskBody({ estimatedMinutes: 20 })).toEqual({ estimatedMinutes: 20 })
  })

  it('accepts a start/pause timer action with no delta required', () => {
    expect(parseUpdateSubtaskBody({ timerAction: 'start' })).toEqual({ timerAction: 'start' })
    expect(parseUpdateSubtaskBody({ timerAction: 'pause' })).toEqual({ timerAction: 'pause' })
  })

  it('accepts an addMinutes/subtractMinutes action with a valid delta', () => {
    expect(parseUpdateSubtaskBody({ timerAction: 'addMinutes', minutesDelta: 5 })).toEqual({
      timerAction: 'addMinutes',
      minutesDelta: 5,
    })
    expect(parseUpdateSubtaskBody({ timerAction: 'subtractMinutes', minutesDelta: 5 })).toEqual({
      timerAction: 'subtractMinutes',
      minutesDelta: 5,
    })
  })

  it('rejects an addMinutes action with a missing or out-of-range delta', () => {
    expect(parseUpdateSubtaskBody({ timerAction: 'addMinutes' })).toBeNull()
    expect(parseUpdateSubtaskBody({ timerAction: 'addMinutes', minutesDelta: 0 })).toBeNull()
    expect(parseUpdateSubtaskBody({ timerAction: 'addMinutes', minutesDelta: 61 })).toBeNull()
  })

  it('rejects an invalid timerAction', () => {
    expect(parseUpdateSubtaskBody({ timerAction: 'stop' })).toBeNull()
  })

  it('rejects an empty body', () => {
    expect(parseUpdateSubtaskBody({})).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseUpdateSubtaskBody(null)).toBeNull()
  })
})
