import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { FiChevronDown, FiChevronUp, FiMessageCircle, FiPlus, FiTrash2 } from 'react-icons/fi'
import { SubtaskRow } from '../SubtaskRow/SubtaskRow'
import { DueDateField } from '../DueDateField/DueDateField'
import { PriorityControl } from '../PriorityControl/PriorityControl'
import { computeTaskProgress, sumEstimatedMinutes } from '../TasksTab.utils'
import {
  Card,
  CollapseButton,
  Description,
  FooterRow,
  HeaderRow,
  MetaRow,
  ProgressBarWrapper,
  ProgressLabel,
  ProgressRow,
  SubtaskList,
  TitleColumn,
  TotalMinutes,
} from './TaskCard.styles'
import type { TaskCardProps } from './TaskCard.interfaces'

// A collapsible group: the header (title + description explaining what the
// subtasks below are) always shows, so the user can grasp what a task is
// about and its overall progress without opening it — the subtask list
// collapses away so a long checklist doesn't overwhelm at a glance.
export function TaskCard({
  task,
  isExpanded,
  onToggleExpand,
  onDeleteTask,
  onPriorityChange,
  onDueDateChange,
  onOpenAddSubtask,
  onGoToChat,
  expandedSubtaskId,
  onToggleSubtaskExpand,
  onToggleSubtaskCompleted,
  onDeleteSubtask,
  onPauseSubtaskTimer,
  onResumeSubtaskTimer,
  onAddSubtaskMinutes,
  onSubtractSubtaskMinutes,
  onSubtaskPriorityChange,
  onSubtaskDueDateChange,
}: TaskCardProps) {
  const { t } = useTranslation()
  const totalMinutes = sumEstimatedMinutes(task)
  const progress = computeTaskProgress(task)

  return (
    <Card>
      <HeaderRow>
        <CollapseButton
          type="button"
          onClick={() => onToggleExpand(task.id)}
          aria-label={isExpanded ? t('tasks.card.collapse') : t('tasks.card.expand')}
        >
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </CollapseButton>
        <TitleColumn>
          <Typography variant="subtitle1">{task.title}</Typography>
          {task.description && <Description>{task.description}</Description>}
        </TitleColumn>
        {task.conversationId !== null && (
          <IconButton
            size="small"
            aria-label={t('tasks.card.goToChat')}
            onClick={() => onGoToChat(task)}
          >
            <FiMessageCircle size={18} />
          </IconButton>
        )}
        <IconButton
          size="small"
          aria-label={t('tasks.card.deleteTask')}
          onClick={() => onDeleteTask(task.id)}
        >
          <FiTrash2 size={16} />
        </IconButton>
      </HeaderRow>

      <MetaRow>
        <PriorityControl
          value={task.priority}
          onChange={(priority) => onPriorityChange(task.id, priority)}
        />
        <DueDateField
          value={task.dueDate}
          onChange={(dueDate) => onDueDateChange(task.id, dueDate)}
          label={t('tasks.dueDateLabel')}
        />
      </MetaRow>

      <TotalMinutes>{t('tasks.card.totalMinutesLabel', { minutes: totalMinutes })}</TotalMinutes>

      <ProgressRow>
        <ProgressBarWrapper>
          <LinearProgress variant="determinate" value={progress} />
        </ProgressBarWrapper>
        <ProgressLabel>{progress}%</ProgressLabel>
      </ProgressRow>

      {isExpanded && (
        <>
          {task.subtasks.length > 0 && (
            <SubtaskList>
              {task.subtasks.map((subtask) => (
                <SubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  isExpanded={expandedSubtaskId === subtask.id}
                  onToggleExpand={onToggleSubtaskExpand}
                  onToggleCompleted={onToggleSubtaskCompleted}
                  onDelete={onDeleteSubtask}
                  onPause={onPauseSubtaskTimer}
                  onResume={onResumeSubtaskTimer}
                  onAddMinutes={onAddSubtaskMinutes}
                  onSubtractMinutes={onSubtractSubtaskMinutes}
                  onPriorityChange={onSubtaskPriorityChange}
                  onDueDateChange={onSubtaskDueDateChange}
                />
              ))}
            </SubtaskList>
          )}
          <FooterRow>
            <Button size="small" startIcon={<FiPlus />} onClick={() => onOpenAddSubtask(task.id)}>
              {t('tasks.card.addSubtask')}
            </Button>
          </FooterRow>
        </>
      )}
    </Card>
  )
}
