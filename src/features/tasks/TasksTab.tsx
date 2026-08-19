import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { FiCheckSquare, FiPlus } from 'react-icons/fi'
import { AddSubtaskDialog } from './AddSubtaskDialog/AddSubtaskDialog'
import { AddTaskDialog } from './AddTaskDialog/AddTaskDialog'
import { TaskCard } from './TaskCard/TaskCard'
import { useTasksTab } from './useTasksTab'
import {
  AddTaskRow,
  EmptyState,
  HeaderRow,
  IconWrapper,
  TaskGroups,
  TasksContainer,
} from './TasksTab.styles'

// Each Task is a collapsible group (TaskCard) explaining what its Subtasks
// are, with its own timer-driven progress rollup — see ROADMAP.md's
// iteration 8 notes for the hierarchy revision. estimatedMinutes on a
// subtask now does drive a real, persisted timer (unlike the original flat
// checklist), started by tapping a subtask row.
export function TasksTab() {
  const { t } = useTranslation()
  const {
    tasks,
    isLoading,
    hasLoadedOnce,
    isTaskExpanded,
    toggleTaskExpanded,
    expandedSubtaskId,
    toggleSubtaskExpanded,
    deleteTask,
    setTaskPriority,
    setTaskDueDate,
    toggleSubtaskCompleted,
    deleteSubtask,
    setSubtaskPriority,
    setSubtaskDueDate,
    pauseSubtaskTimer,
    resumeSubtaskTimer,
    addSubtaskMinutes,
    subtractSubtaskMinutes,
    isAddTaskDialogOpen,
    openAddTaskDialog,
    closeAddTaskDialog,
    confirmAddTask,
    addSubtaskForTaskId,
    openAddSubtaskDialog,
    closeAddSubtaskDialog,
    confirmAddSubtask,
    goToSourceConversation,
  } = useTasksTab()

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
        <TaskGroups>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={isTaskExpanded(task.id)}
              onToggleExpand={toggleTaskExpanded}
              onDeleteTask={deleteTask}
              onPriorityChange={setTaskPriority}
              onDueDateChange={setTaskDueDate}
              onOpenAddSubtask={openAddSubtaskDialog}
              onGoToChat={goToSourceConversation}
              expandedSubtaskId={expandedSubtaskId}
              onToggleSubtaskExpand={toggleSubtaskExpanded}
              onToggleSubtaskCompleted={toggleSubtaskCompleted}
              onDeleteSubtask={deleteSubtask}
              onPauseSubtaskTimer={pauseSubtaskTimer}
              onResumeSubtaskTimer={resumeSubtaskTimer}
              onAddSubtaskMinutes={addSubtaskMinutes}
              onSubtractSubtaskMinutes={subtractSubtaskMinutes}
              onSubtaskPriorityChange={setSubtaskPriority}
              onSubtaskDueDateChange={setSubtaskDueDate}
            />
          ))}
        </TaskGroups>
      )}

      <AddTaskRow>
        <Button variant="outlined" startIcon={<FiPlus />} onClick={openAddTaskDialog}>
          {t('tasks.addTaskButton')}
        </Button>
      </AddTaskRow>

      <AddTaskDialog
        open={isAddTaskDialogOpen}
        onCancel={closeAddTaskDialog}
        onConfirm={confirmAddTask}
      />
      <AddSubtaskDialog
        open={addSubtaskForTaskId !== null}
        onCancel={closeAddSubtaskDialog}
        onConfirm={confirmAddSubtask}
      />
    </TasksContainer>
  )
}
