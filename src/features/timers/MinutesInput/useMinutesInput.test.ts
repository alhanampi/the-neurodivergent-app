import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMinutesInput } from './useMinutesInput'

function setup(value = 10, min = 1, max = 180, step = 5) {
  const onChange = vi.fn()
  const { result, rerender } = renderHook(
    (props: { value: number }) => useMinutesInput({ value: props.value, onChange, min, max, step }),
    { initialProps: { value } },
  )
  return { onChange, result, rerender }
}

describe('useMinutesInput', () => {
  it('starts with the given value as its draft text', () => {
    const { result } = setup(25)
    expect(result.current.draft).toBe('25')
  })

  it('follows external value changes while not focused', () => {
    const { result, rerender } = setup(10)
    rerender({ value: 30 })
    expect(result.current.draft).toBe('30')
  })

  it('does not clobber an in-progress keystroke with an external value change', () => {
    const { result, rerender } = setup(10)

    act(() => result.current.handleFocus())
    act(() =>
      result.current.handleTextChange({
        target: { value: '1' },
      } as unknown as Parameters<(typeof result)['current']['handleTextChange']>[0]),
    )
    expect(result.current.draft).toBe('1')

    rerender({ value: 99 })
    expect(result.current.draft).toBe('1')
  })

  it('commits a typed value on blur, clamped to range', () => {
    const { result, onChange } = setup(10, 1, 60)

    act(() => result.current.handleFocus())
    act(() =>
      result.current.handleTextChange({
        target: { value: '999' },
      } as unknown as Parameters<(typeof result)['current']['handleTextChange']>[0]),
    )
    act(() => result.current.commitDraft())

    expect(onChange).toHaveBeenCalledWith(60)
    expect(result.current.draft).toBe('60')
  })

  it('falls back to the last committed value when the draft is empty/invalid', () => {
    const { result, onChange } = setup(10)

    act(() => result.current.handleFocus())
    act(() =>
      result.current.handleTextChange({
        target: { value: '' },
      } as unknown as Parameters<(typeof result)['current']['handleTextChange']>[0]),
    )
    act(() => result.current.commitDraft())

    expect(onChange).toHaveBeenCalledWith(10)
  })

  it('strips non-digit characters as the user types', () => {
    const { result } = setup(10)

    act(() => result.current.handleFocus())
    act(() =>
      result.current.handleTextChange({
        target: { value: '1a2b' },
      } as unknown as Parameters<(typeof result)['current']['handleTextChange']>[0]),
    )

    expect(result.current.draft).toBe('12')
  })

  it('increments and decrements immediately by the given step, clamped', () => {
    const { result, onChange } = setup(10, 1, 20, 5)

    act(() => result.current.increment())
    expect(onChange).toHaveBeenLastCalledWith(15)

    act(() => result.current.decrement())
    expect(onChange).toHaveBeenLastCalledWith(5)
  })

  it('scrolling up increases and scrolling down decreases, clamped to range', () => {
    const { result, onChange } = setup(10, 1, 12, 5)

    act(() =>
      result.current.handleWheel({
        deltaY: -100,
        preventDefault: vi.fn(),
      } as unknown as Parameters<(typeof result)['current']['handleWheel']>[0]),
    )
    expect(onChange).toHaveBeenLastCalledWith(12)

    act(() =>
      result.current.handleWheel({
        deltaY: 100,
        preventDefault: vi.fn(),
      } as unknown as Parameters<(typeof result)['current']['handleWheel']>[0]),
    )
    expect(onChange).toHaveBeenLastCalledWith(5)
  })

  it('Enter blurs the field, triggering the browser blur/commit flow', () => {
    const { result } = setup(10)
    const blur = vi.fn()

    act(() =>
      result.current.handleKeyDown({
        key: 'Enter',
        currentTarget: { blur },
      } as unknown as Parameters<(typeof result)['current']['handleKeyDown']>[0]),
    )

    expect(blur).toHaveBeenCalledTimes(1)
  })
})
