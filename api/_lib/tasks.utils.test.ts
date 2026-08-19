import { describe, expect, it } from 'vitest'
import {
  parseCreateTasksBody,
  parseDueDate,
  parseTaskPriority,
  parseUpdateTaskBody,
} from './tasks.utils.js'

describe('parseTaskPriority', () => {
  it('defaults to medium when omitted', () => {
    expect(parseTaskPriority(undefined)).toBe('medium')
  })

  it('accepts a valid priority', () => {
    expect(parseTaskPriority('low')).toBe('low')
    expect(parseTaskPriority('high')).toBe('high')
  })

  it('rejects an invalid priority', () => {
    expect(parseTaskPriority('urgent')).toBeNull()
    expect(parseTaskPriority(1)).toBeNull()
  })
})

describe('parseDueDate', () => {
  it('accepts a well-formed date', () => {
    expect(parseDueDate('2026-08-19')).toBe('2026-08-19')
  })

  it('accepts null', () => {
    expect(parseDueDate(null)).toBeNull()
  })

  it('rejects a malformed date', () => {
    expect(parseDueDate('08/19/2026')).toBeNull()
    expect(parseDueDate('not a date')).toBeNull()
    expect(parseDueDate(20260819)).toBeNull()
  })
})

describe('parseCreateTasksBody', () => {
  const validSteps = [
    { title: 'Wash dishes', minutes: 10 },
    { title: 'Wipe counters', minutes: 5 },
  ]

  it('accepts a well-formed batch with defaults filled in', () => {
    expect(parseCreateTasksBody({ title: 'Clean kitchen', steps: validSteps })).toEqual({
      title: 'Clean kitchen',
      description: null,
      priority: 'medium',
      dueDate: null,
      conversationId: null,
      steps: validSteps.map((step) =>
        Object.assign({}, step, { priority: 'medium', dueDate: null }),
      ),
    })
  })

  it('accepts an empty steps array (manual "Add Task" with no subtasks yet)', () => {
    const result = parseCreateTasksBody({ title: 'New task', steps: [] })
    expect(result?.steps).toEqual([])
  })

  it('trims titles and rounds minutes', () => {
    const result = parseCreateTasksBody({
      title: '  Clean kitchen  ',
      steps: [{ title: '  Wash dishes  ', minutes: 10.4 }],
    })
    expect(result?.title).toBe('Clean kitchen')
    expect(result?.steps[0]).toEqual({
      title: 'Wash dishes',
      minutes: 10,
      priority: 'medium',
      dueDate: null,
    })
  })

  it('accepts optional description/priority/dueDate/conversationId', () => {
    const result = parseCreateTasksBody({
      title: 'Clean kitchen',
      description: 'A quick tidy-up',
      priority: 'high',
      dueDate: '2026-08-20',
      conversationId: 5,
      steps: [],
    })
    expect(result).toMatchObject({
      description: 'A quick tidy-up',
      priority: 'high',
      dueDate: '2026-08-20',
      conversationId: 5,
    })
  })

  it('rejects more than 12 steps', () => {
    const steps = Array.from({ length: 13 }, (_, i) => ({ title: `Step ${i}`, minutes: 5 }))
    expect(parseCreateTasksBody({ title: 'Task', steps })).toBeNull()
  })

  it('rejects a step with an out-of-range minutes value', () => {
    expect(
      parseCreateTasksBody({ title: 'Task', steps: [{ title: 'Step', minutes: 0 }] }),
    ).toBeNull()
    expect(
      parseCreateTasksBody({ title: 'Task', steps: [{ title: 'Step', minutes: 181 }] }),
    ).toBeNull()
  })

  it('rejects a step with an empty or too-long title', () => {
    expect(parseCreateTasksBody({ title: 'Task', steps: [{ title: '', minutes: 5 }] })).toBeNull()
    expect(
      parseCreateTasksBody({ title: 'Task', steps: [{ title: 'x'.repeat(121), minutes: 5 }] }),
    ).toBeNull()
  })

  it('rejects an empty or missing task title', () => {
    expect(parseCreateTasksBody({ title: '', steps: [] })).toBeNull()
    expect(parseCreateTasksBody({ steps: [] })).toBeNull()
  })

  it('rejects a missing steps array', () => {
    expect(parseCreateTasksBody({ title: 'Task' })).toBeNull()
  })

  it('rejects an invalid conversationId', () => {
    expect(parseCreateTasksBody({ title: 'Task', conversationId: -1, steps: [] })).toBeNull()
    expect(parseCreateTasksBody({ title: 'Task', conversationId: 1.5, steps: [] })).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseCreateTasksBody(null)).toBeNull()
  })
})

describe('parseUpdateTaskBody', () => {
  it('accepts a well-formed partial body', () => {
    expect(parseUpdateTaskBody({ title: 'New title' })).toEqual({ title: 'New title' })
    expect(parseUpdateTaskBody({ priority: 'low' })).toEqual({ priority: 'low' })
    expect(parseUpdateTaskBody({ dueDate: null })).toEqual({ dueDate: null })
  })

  it('rejects an empty body', () => {
    expect(parseUpdateTaskBody({})).toBeNull()
  })

  it('rejects an invalid priority', () => {
    expect(parseUpdateTaskBody({ priority: 'urgent' })).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseUpdateTaskBody(null)).toBeNull()
  })
})
