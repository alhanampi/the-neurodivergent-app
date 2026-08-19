import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FiTrash2 } from 'react-icons/fi'
import { MinutesInput } from '@/features/timers/MinutesInput/MinutesInput'
import { MAX_CUSTOM_MINUTES, MIN_CUSTOM_MINUTES } from '@/features/timers/TimersTab.constants'
import { getPriorityChipColor } from '@/features/tasks/TasksTab.utils'
import {
  ActionsRow,
  Card,
  StepRow,
  StepTitleField,
  TaskFieldsColumn,
} from './PlanPreviewCard.styles'
import type { PlanPreviewCardProps } from './PlanPreviewCard.interfaces'

// Reuses MinutesInput and its bounds from the timers feature — same
// cross-feature-reuse convention DashboardTab.interfaces.ts already uses
// for timer types (both live in src/, ship in the same client bundle, no
// secret/server boundary crossed). All-props, no local business logic —
// edits are reported up to useAiChatTab immediately, not buffered here.
// taskTitle/taskDescription are AI-suggested but editable — they become the
// Task group's own title/description once confirmed. Priority IS
// AI-estimated per step now (see chat-plan.utils.ts's buildPlanSystemPrompt)
// and shown here read-only for visibility before confirming; due date still
// isn't requested from the model (no real basis for a specific date) and
// stays user-set afterward in the Tasks tab.
export function PlanPreviewCard({
  taskTitle,
  onTaskTitleChange,
  taskDescription,
  onTaskDescriptionChange,
  steps,
  onTitleChange,
  onMinutesChange,
  onRemoveStep,
  onDiscard,
  onConfirm,
  isSending,
}: PlanPreviewCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <Typography variant="subtitle2">{t('chat.plan.title')}</Typography>

      <TaskFieldsColumn>
        <TextField
          size="small"
          fullWidth
          label={t('chat.plan.taskTitleLabel')}
          value={taskTitle}
          onChange={(event) => onTaskTitleChange(event.target.value)}
        />
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          label={t('chat.plan.taskDescriptionLabel')}
          value={taskDescription}
          onChange={(event) => onTaskDescriptionChange(event.target.value)}
        />
      </TaskFieldsColumn>

      {steps.map((step) => (
        <StepRow key={step.id}>
          <StepTitleField>
            <TextField
              size="small"
              fullWidth
              value={step.title}
              onChange={(event) => onTitleChange(step.id, event.target.value)}
            />
          </StepTitleField>
          <Chip
            size="small"
            label={t(`tasks.priority.${step.priority}`)}
            color={getPriorityChipColor(step.priority)}
          />
          <MinutesInput
            value={step.minutes}
            onChange={(minutes) => onMinutesChange(step.id, minutes)}
            min={MIN_CUSTOM_MINUTES}
            max={MAX_CUSTOM_MINUTES}
            ariaLabel={t('chat.plan.stepMinutesLabel')}
          />
          <IconButton
            size="small"
            aria-label={t('chat.plan.removeStepLabel')}
            onClick={() => onRemoveStep(step.id)}
          >
            <FiTrash2 size={16} />
          </IconButton>
        </StepRow>
      ))}

      <ActionsRow>
        <Button onClick={onDiscard} disabled={isSending}>
          {t('chat.plan.discard')}
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={isSending || steps.length === 0}>
          {t('chat.plan.sendToTasks')}
        </Button>
      </ActionsRow>
    </Card>
  )
}
