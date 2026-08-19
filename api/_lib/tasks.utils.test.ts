import { describe, expect, it } from 'vitest'
import { parseCreateTasksBody, parseUpdateTaskBody } from './tasks.utils.js'

describe('parseCreateTasksBody', () => {
  const validSteps = [
    { title: 'Wash dishes', minutes: 10 },
    { title: 'Wipe counters', minutes: 5 },
  ]

  it('accepts a well-formed batch', () => {
    expect(parseCreateTasksBody({ steps: validSteps })).toEqual({ steps: validSteps })
  })

  it('trims titles and rounds minutes', () => {
    const result = parseCreateTasksBody({
      steps: [{ title: '  Wash dishes  ', minutes: 10.4 }],
    })
    expect(result).toEqual({ steps: [{ title: 'Wash dishes', minutes: 10 }] })
  })

  it('rejects an empty steps array', () => {
    expect(parseCreateTasksBody({ steps: [] })).toBeNull()
  })

  it('rejects more than 12 steps', () => {
    const steps = Array.from({ length: 13 }, (_, i) => ({ title: `Step ${i}`, minutes: 5 }))
    expect(parseCreateTasksBody({ steps })).toBeNull()
  })

  it('rejects a step with an out-of-range minutes value', () => {
    expect(parseCreateTasksBody({ steps: [{ title: 'Step', minutes: 0 }] })).toBeNull()
    expect(parseCreateTasksBody({ steps: [{ title: 'Step', minutes: 181 }] })).toBeNull()
  })

  it('rejects a step with an empty or too-long title', () => {
    expect(parseCreateTasksBody({ steps: [{ title: '', minutes: 5 }] })).toBeNull()
    expect(parseCreateTasksBody({ steps: [{ title: 'x'.repeat(121), minutes: 5 }] })).toBeNull()
  })

  it('rejects a missing steps array', () => {
    expect(parseCreateTasksBody({})).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseCreateTasksBody(null)).toBeNull()
  })
})

describe('parseUpdateTaskBody', () => {
  it('accepts a well-formed body', () => {
    expect(parseUpdateTaskBody({ completed: true })).toEqual({ completed: true })
    expect(parseUpdateTaskBody({ completed: false })).toEqual({ completed: false })
  })

  it('rejects a non-boolean completed flag', () => {
    expect(parseUpdateTaskBody({ completed: 'yes' })).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseUpdateTaskBody(null)).toBeNull()
  })
})
