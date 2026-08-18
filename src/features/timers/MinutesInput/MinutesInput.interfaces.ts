import type { ChangeEvent, KeyboardEvent, WheelEvent } from 'react'

export interface MinutesInputProps {
  value: number
  onChange: (minutes: number) => void
  min: number
  max: number
  /** Applied by both the +/-buttons and one mouse-wheel notch — kept as a
   * single value on purpose (see MinutesInput.tsx) so scrolling and tapping
   * a button always move the value by the same, predictable amount. */
  step?: number
  disabled?: boolean
  ariaLabel: string
}

export interface UseMinutesInputParams {
  value: number
  onChange: (minutes: number) => void
  min: number
  max: number
  step: number
}

export interface UseMinutesInputResult {
  draft: string
  handleFocus: () => void
  handleTextChange: (event: ChangeEvent<HTMLInputElement>) => void
  commitDraft: () => void
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  handleWheel: (event: WheelEvent<HTMLInputElement>) => void
  decrement: () => void
  increment: () => void
}
