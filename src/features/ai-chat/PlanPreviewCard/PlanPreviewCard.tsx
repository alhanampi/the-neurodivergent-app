import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FiTrash2 } from 'react-icons/fi'
import { MinutesInput } from '@/features/timers/MinutesInput/MinutesInput'
import { MAX_CUSTOM_MINUTES, MIN_CUSTOM_MINUTES } from '@/features/timers/TimersTab.constants'
import { ActionsRow, Card, StepRow, StepTitleField } from './PlanPreviewCard.styles'
import type { PlanPreviewCardProps } from './PlanPreviewCard.interfaces'

// Reuses MinutesInput and its bounds from the timers feature — same
// cross-feature-reuse convention DashboardTab.interfaces.ts already uses
// for timer types (both live in src/, ship in the same client bundle, no
// secret/server boundary crossed). All-props, no local business logic —
// edits are reported up to useAiChatTab immediately, not buffered here.
export function PlanPreviewCard({
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
