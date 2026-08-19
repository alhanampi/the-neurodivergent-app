import { useTranslation } from 'react-i18next'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { FiCheckSquare, FiTrash2 } from 'react-icons/fi'
import { useTasksTab } from './useTasksTab'
import {
  EmptyState,
  HeaderRow,
  IconWrapper,
  TaskList,
  TaskMinutes,
  TaskRow,
  TasksContainer,
  TaskTitle,
} from './TasksTab.styles'

// A flat checklist — no timer pressure, on purpose (see ROADMAP.md's
// iteration 8 notes). estimatedMinutes is a display label only, never a
// running countdown; there's deliberately no "start a timer from this task"
// shortcut, which would reintroduce exactly the pressure this tab exists to
// avoid.
export function TasksTab() {
  const { t } = useTranslation()
  const { tasks, isLoading, hasLoadedOnce, toggleTask, deleteTask } = useTasksTab()

  const isEmpty = hasLoadedOnce && !isLoading && tasks.length === 0

  return (
    <TasksContainer>
      <HeaderRow>
        <IconWrapper>
          <FiCheckSquare />
        </IconWrapper>
        <Typography variant="h5" component="h1">
          {t('tasks.title')}
        </Typography>
      </HeaderRow>

      {!hasLoadedOnce && isLoading && <EmptyState>{t('tasks.loading')}</EmptyState>}
      {isEmpty && <EmptyState>{t('tasks.empty')}</EmptyState>}

      {tasks.length > 0 && (
        <TaskList>
          {tasks.map((task) => (
            <TaskRow key={task.id} $completed={task.completed}>
              <Checkbox
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                slotProps={{
                  input: {
                    'aria-label': task.completed
                      ? t('tasks.item.markNotDone')
                      : t('tasks.item.markDone'),
                  },
                }}
              />
              <TaskTitle $completed={task.completed}>{task.title}</TaskTitle>
              <TaskMinutes>
                {t('tasks.item.minutesLabel', { minutes: task.estimatedMinutes })}
              </TaskMinutes>
              <IconButton
                size="small"
                aria-label={t('tasks.item.deleteLabel')}
                onClick={() => deleteTask(task.id)}
              >
                <FiTrash2 size={16} />
              </IconButton>
            </TaskRow>
          ))}
        </TaskList>
      )}
    </TasksContainer>
  )
}
