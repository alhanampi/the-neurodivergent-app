import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n/i18n'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { PlanPreviewCard } from './PlanPreviewCard'
import type { PlanPreviewCardProps } from './PlanPreviewCard.interfaces'

function renderCard(overrides: Partial<PlanPreviewCardProps> = {}) {
  const props: PlanPreviewCardProps = {
    taskTitle: 'Clean kitchen',
    onTaskTitleChange: vi.fn(),
    taskDescription: 'A few quick steps to tidy up.',
    onTaskDescriptionChange: vi.fn(),
    steps: [
      { id: '1', title: 'Wash dishes', minutes: 10, priority: 'medium' },
      { id: '2', title: 'Wipe counters', minutes: 5, priority: 'low' },
    ],
    onTitleChange: vi.fn(),
    onMinutesChange: vi.fn(),
    onRemoveStep: vi.fn(),
    onDiscard: vi.fn(),
    onConfirm: vi.fn(),
    isSending: false,
    ...overrides,
  }
  render(
    <ThemeModeProvider>
      <PlanPreviewCard {...props} />
    </ThemeModeProvider>,
  )
  return props
}

afterEach(() => {
  void i18n.changeLanguage('en')
})

describe('PlanPreviewCard', () => {
  it('renders and edits the task title/description', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    expect(screen.getByDisplayValue('Clean kitchen')).toBeInTheDocument()
    await user.type(screen.getByDisplayValue('Clean kitchen'), '!')
    expect(props.onTaskTitleChange).toHaveBeenCalledWith('Clean kitchen!')
  })

  it('renders each step title and minutes', () => {
    renderCard()

    expect(screen.getByDisplayValue('Wash dishes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Wipe counters')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('calls onTitleChange when a title is edited', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.type(screen.getByDisplayValue('Wash dishes'), '!')

    expect(props.onTitleChange).toHaveBeenCalledWith('1', 'Wash dishes!')
  })

  it('calls onMinutesChange via the +/- buttons', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    const increaseButtons = screen.getAllByRole('button', { name: 'Increase minutes' })
    await user.click(increaseButtons[0])

    expect(props.onMinutesChange).toHaveBeenCalledWith('1', 15)
  })

  it('calls onRemoveStep for the clicked step', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    const removeButtons = screen.getAllByRole('button', { name: 'Remove step' })
    await user.click(removeButtons[1])

    expect(props.onRemoveStep).toHaveBeenCalledWith('2')
  })

  it('calls onDiscard and onConfirm from their buttons', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(props.onDiscard).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Send to Tasks' }))
    expect(props.onConfirm).toHaveBeenCalled()
  })

  it('disables "Send to Tasks" once there are no steps left', () => {
    renderCard({ steps: [] })

    expect(screen.getByRole('button', { name: 'Send to Tasks' })).toBeDisabled()
  })
})
