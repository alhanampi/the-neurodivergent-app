import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, WheelEvent } from 'react'
import { clampMinutes } from '../TimersTab.utils'
import type { UseMinutesInputParams, UseMinutesInputResult } from './MinutesInput.interfaces'

/**
 * Backs an editable minutes field: local text while the user is typing (so
 * an in-progress keystroke like "1" isn't clamped/overwritten before they
 * finish typing "12"), committed on blur/Enter; plus immediate,
 * already-clamped commits for the wheel and +/- buttons, which are discrete
 * steps rather than free text.
 */
export function useMinutesInput({
  value,
  onChange,
  min,
  max,
  step,
}: UseMinutesInputParams): UseMinutesInputResult {
  const [draft, setDraft] = useState(String(value))
  // A ref, not state: it only gates the sync effect below and must never be
  // a dependency of it. If it were state, committing a value would flip
  // isFocused → rerun the effect → and since a controlled `value` prop only
  // catches up once the parent re-renders, that extra run could briefly
  // clobber the just-committed draft back to the stale prop.
  const isFocusedRef = useRef(false)

  // Follows external changes (a preset button reseeding the value, another
  // control editing the same instance) as long as the user isn't mid-keystroke.
  useEffect(() => {
    if (!isFocusedRef.current) setDraft(String(value))
  }, [value])

  const commit = (next: number) => {
    const clamped = clampMinutes(next, min, max)
    onChange(clamped)
    setDraft(String(clamped))
  }

  const handleFocus = () => {
    isFocusedRef.current = true
  }

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value.replace(/\D/g, '').slice(0, 4))
  }

  const commitDraft = () => {
    isFocusedRef.current = false
    const parsed = Number.parseInt(draft, 10)
    commit(Number.isNaN(parsed) ? value : parsed)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  const handleWheel = (event: WheelEvent<HTMLInputElement>) => {
    event.preventDefault()
    commit(value + (event.deltaY < 0 ? step : -step))
  }

  const decrement = () => commit(value - step)
  const increment = () => commit(value + step)

  return {
    draft,
    handleFocus,
    handleTextChange,
    commitDraft,
    handleKeyDown,
    handleWheel,
    decrement,
    increment,
  }
}
