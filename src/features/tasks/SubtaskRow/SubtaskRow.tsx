import { useTranslation } from 'react-i18next'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import { FiMinus, FiPause, FiPlay, FiPlus, FiTrash2 } from 'react-icons/fi'
import { DueDateField } from '../DueDateField/DueDateField'
import { PriorityControl } from '../PriorityControl/PriorityControl'
import { SUBTASK_MINUTES_STEP } from '../TasksTab.constants'
import {
  computeLiveRemainingSeconds,
  formatSecondsAsClock,
  getPriorityChipColor,
} from '../TasksTab.utils'
import {
  CompletedTitle,
  Countdown,
  HeaderLine,
  MetaRow,
  Row,
  SubtaskMinutes,
  TimerControlsRow,
  TimerPanel,
  TitleButton,
} from './SubtaskRow.styles'
import type { SubtaskRowProps } from './SubtaskRow.interfaces'

// Tapping the title (not the checkbox) expands the timer panel and,
// per the product requirement, auto-starts the timer the first time (see
// useTasksTab's toggleSubtaskExpanded — an already running/paused subtask
// just toggles the panel without restarting).
export function SubtaskRow({
  subtask,
  isExpanded,
  onToggleExpand,
  onToggleCompleted,
  onDelete,
  onPause,
  onResume,
  onAddMinutes,
  onSubtractMinutes,
  onPriorityChange,
  onDueDateChange,
}: SubtaskRowProps) {
  const { t } = useTranslation()
  const remainingSeconds = computeLiveRemainingSeconds(subtask)
  const isRunning = subtask.timerStatus === 'running'

  return (
    <Row $completed={subtask.completed}>
      <HeaderLine>
        <Checkbox
          checked={subtask.completed}
          onChange={() => onToggleCompleted(subtask.id)}
          slotProps={{
            input: {
              'aria-label': subtask.completed
                ? t('tasks.item.markNotDone')
                : t('tasks.item.markDone'),
            },
          }}
        />
        <TitleButton onClick={() => onToggleExpand(subtask.id)} type="button">
          <CompletedTitle $completed={subtask.completed}>{subtask.title}</CompletedTitle>
        </TitleButton>
        <Chip
          size="small"
          label={t(`tasks.priority.${subtask.priority}`)}
          color={getPriorityChipColor(subtask.priority)}
        />
        <SubtaskMinutes>
          {t('tasks.item.minutesLabel', { minutes: subtask.estimatedMinutes })}
        </SubtaskMinutes>
        <IconButton
          size="small"
          aria-label={t('tasks.item.deleteLabel')}
          onClick={() => onDelete(subtask.id)}
        >
          <FiTrash2 size={16} />
        </IconButton>
      </HeaderLine>

      {isExpanded && (
        <TimerPanel>
          <TimerControlsRow>
            <IconButton
              size="small"
              aria-label={t('tasks.item.subtractMinutes')}
              onClick={() => onSubtractMinutes(subtask.id, SUBTASK_MINUTES_STEP)}
            >
              <FiMinus />
            </IconButton>
            <Countdown>{formatSecondsAsClock(remainingSeconds)}</Countdown>
            <IconButton
              size="small"
              aria-label={t('tasks.item.addMinutes')}
              onClick={() => onAddMinutes(subtask.id, SUBTASK_MINUTES_STEP)}
            >
              <FiPlus />
            </IconButton>
            <IconButton
              size="small"
              aria-label={isRunning ? t('tasks.item.pauseTimer') : t('tasks.item.resumeTimer')}
              onClick={() => (isRunning ? onPause(subtask.id) : onResume(subtask.id))}
            >
              {isRunning ? <FiPause /> : <FiPlay />}
            </IconButton>
          </TimerControlsRow>
          <MetaRow>
            <PriorityControl
              value={subtask.priority}
              onChange={(priority) => onPriorityChange(subtask.id, priority)}
            />
            <DueDateField
              value={subtask.dueDate}
              onChange={(dueDate) => onDueDateChange(subtask.id, dueDate)}
              label={t('tasks.dueDateLabel')}
            />
          </MetaRow>
        </TimerPanel>
      )}
    </Row>
  )
}
