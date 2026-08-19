import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { SUBTASK_TICK_INTERVAL_MS } from './TasksTab.constants'
import {
  createSubtaskRequest,
  createTaskRequest,
  deleteSubtaskRequest,
  deleteTaskRequest,
  fetchTasks,
  patchSubtaskRequest,
  patchTaskRequest,
} from './useTasksTab.utils'
import type {
  CreateSubtaskInput,
  CreateTaskInput,
  UpdateSubtaskInput,
  UpdateTaskInput,
} from './useTasksTab.utils'
import type { SubtaskRecord, TaskPriority, TaskRecord } from './TasksTab.interfaces'

function replaceTask(tasks: TaskRecord[], updated: TaskRecord): TaskRecord[] {
  return tasks.map((task) => (task.id === updated.id ? updated : task))
}

function replaceSubtask(tasks: TaskRecord[], updated: SubtaskRecord): TaskRecord[] {
  return tasks.map((task) =>
    task.id === updated.taskId
      ? { ...task, subtasks: task.subtasks.map((s) => (s.id === updated.id ? updated : s)) }
      : task,
  )
}

function patchSubtaskLocally(
  tasks: TaskRecord[],
  subtaskId: number,
  patch: Partial<SubtaskRecord>,
): TaskRecord[] {
  return tasks.map((task) => ({
    ...task,
    subtasks: task.subtasks.map((s) => (s.id === subtaskId ? { ...s, ...patch } : s)),
  }))
}

export function useTasksTab() {
  const { isSignedIn, getToken } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<number>>(new Set())
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<number | null>(null)
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
  const [addSubtaskForTaskId, setAddSubtaskForTaskId] = useState<number | null>(null)
  // Forces a re-render every tick while at least one subtask timer is
  // running, so live countdowns (derived from timerEndAt, not stored state)
  // stay current — same "ref-driven interval, no per-tick setState churn
  // beyond what's needed to repaint" spirit as useTimersTab.ts, just simpler
  // since there's nothing else to recompute per tick here.
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false
    setIsLoading(true)
    void fetchTasks(getToken).then((result) => {
      if (cancelled) return
      setTasks(result)
      setIsLoading(false)
      setHasLoadedOnce(true)
    })
    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken])

  const hasRunningTimer = useMemo(
    () => tasks.some((task) => task.subtasks.some((s) => s.timerStatus === 'running')),
    [tasks],
  )

  useEffect(() => {
    if (!hasRunningTimer) return
    const interval = setInterval(() => setTick((t) => t + 1), SUBTASK_TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [hasRunningTimer])

  const toggleTaskExpanded = useCallback((taskId: number) => {
    setCollapsedTaskIds((current) => {
      const next = new Set(current)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }, [])

  const isTaskExpanded = useCallback(
    (taskId: number) => !collapsedTaskIds.has(taskId),
    [collapsedTaskIds],
  )

  const deleteTask = useCallback(
    (taskId: number) => {
      const removed = tasks.find((task) => task.id === taskId)
      setTasks((current) => current.filter((task) => task.id !== taskId))
      void deleteTaskRequest(taskId, getToken).then((success) => {
        if (!success && removed) setTasks((current) => [...current, removed])
      })
    },
    [tasks, getToken],
  )

  const updateTaskFields = useCallback(
    (taskId: number, patch: UpdateTaskInput) => {
      const target = tasks.find((task) => task.id === taskId)
      if (!target) return
      // Spread `patch` last so an explicit `null` (clearing description/
      // dueDate) overwrites the target's value — a `??` fallback here would
      // wrongly treat that explicit null the same as "field omitted".
      const optimistic: TaskRecord = { ...target, ...patch }
      setTasks((current) => replaceTask(current, optimistic))
      void patchTaskRequest(taskId, patch, getToken).then((updated) => {
        if (updated) setTasks((current) => replaceTask(current, updated))
      })
    },
    [tasks, getToken],
  )

  const setTaskPriority = useCallback(
    (taskId: number, priority: TaskPriority) => updateTaskFields(taskId, { priority }),
    [updateTaskFields],
  )
  const setTaskDueDate = useCallback(
    (taskId: number, dueDate: string | null) => updateTaskFields(taskId, { dueDate }),
    [updateTaskFields],
  )

  // Optimistic toggle-complete with rollback on failure — flips the
  // checkbox immediately, then reconciles with the server's response (or
  // reverts if the request failed), same pattern as the original flat
  // Tasks tab's toggleTask.
  const toggleSubtaskCompleted = useCallback(
    (subtaskId: number) => {
      const target = tasks.flatMap((task) => task.subtasks).find((s) => s.id === subtaskId)
      if (!target) return
      const nextCompleted = !target.completed

      setTasks((current) =>
        patchSubtaskLocally(current, subtaskId, {
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        }),
      )

      void patchSubtaskRequest(subtaskId, { completed: nextCompleted }, getToken).then(
        (updated) => {
          setTasks((current) =>
            updated
              ? replaceSubtask(current, updated)
              : patchSubtaskLocally(current, subtaskId, {
                  completed: target.completed,
                  completedAt: target.completedAt,
                }),
          )
        },
      )
    },
    [tasks, getToken],
  )

  const deleteSubtask = useCallback(
    (subtaskId: number) => {
      const task = tasks.find((t) => t.subtasks.some((s) => s.id === subtaskId))
      const removed = task?.subtasks.find((s) => s.id === subtaskId)
      setTasks((current) =>
        current.map((t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) })),
      )
      void deleteSubtaskRequest(subtaskId, getToken).then((success) => {
        if (!success && task && removed) {
          setTasks((current) =>
            current.map((t) =>
              t.id === task.id ? { ...t, subtasks: [...t.subtasks, removed] } : t,
            ),
          )
        }
      })
    },
    [tasks, getToken],
  )

  const updateSubtaskFields = useCallback(
    (subtaskId: number, patch: UpdateSubtaskInput) => {
      setTasks((current) =>
        patchSubtaskLocally(current, subtaskId, patch as Partial<SubtaskRecord>),
      )
      void patchSubtaskRequest(subtaskId, patch, getToken).then((updated) => {
        if (updated) setTasks((current) => replaceSubtask(current, updated))
      })
    },
    [getToken],
  )

  const setSubtaskPriority = useCallback(
    (subtaskId: number, priority: TaskPriority) => updateSubtaskFields(subtaskId, { priority }),
    [updateSubtaskFields],
  )
  const setSubtaskDueDate = useCallback(
    (subtaskId: number, dueDate: string | null) => updateSubtaskFields(subtaskId, { dueDate }),
    [updateSubtaskFields],
  )

  const applyTimerAction = useCallback(
    (subtaskId: number, timerAction: UpdateSubtaskInput['timerAction'], minutesDelta?: number) => {
      void patchSubtaskRequest(subtaskId, { timerAction, minutesDelta }, getToken).then(
        (updated) => {
          if (updated) setTasks((current) => replaceSubtask(current, updated))
        },
      )
    },
    [getToken],
  )

  // Expanding a subtask's timer panel auto-starts it if idle — tapping the
  // row is the "start" gesture; an already running/paused subtask just
  // toggles the panel without restarting.
  const toggleSubtaskExpanded = useCallback(
    (subtaskId: number) => {
      setExpandedSubtaskId((current) => (current === subtaskId ? null : subtaskId))
      const target = tasks.flatMap((task) => task.subtasks).find((s) => s.id === subtaskId)
      if (target && target.timerStatus === 'idle' && expandedSubtaskId !== subtaskId) {
        applyTimerAction(subtaskId, 'start')
      }
    },
    [tasks, expandedSubtaskId, applyTimerAction],
  )

  const pauseSubtaskTimer = useCallback(
    (subtaskId: number) => applyTimerAction(subtaskId, 'pause'),
    [applyTimerAction],
  )
  const resumeSubtaskTimer = useCallback(
    (subtaskId: number) => applyTimerAction(subtaskId, 'start'),
    [applyTimerAction],
  )
  const addSubtaskMinutes = useCallback(
    (subtaskId: number, minutes: number) => applyTimerAction(subtaskId, 'addMinutes', minutes),
    [applyTimerAction],
  )
  const subtractSubtaskMinutes = useCallback(
    (subtaskId: number, minutes: number) => applyTimerAction(subtaskId, 'subtractMinutes', minutes),
    [applyTimerAction],
  )

  const openAddTaskDialog = useCallback(() => setIsAddTaskDialogOpen(true), [])
  const closeAddTaskDialog = useCallback(() => setIsAddTaskDialogOpen(false), [])

  const confirmAddTask = useCallback(
    async (input: CreateTaskInput) => {
      setIsAddTaskDialogOpen(false)
      const created = await createTaskRequest(input, getToken)
      if (created) setTasks((current) => [created, ...current])
    },
    [getToken],
  )

  const openAddSubtaskDialog = useCallback((taskId: number) => setAddSubtaskForTaskId(taskId), [])
  const closeAddSubtaskDialog = useCallback(() => setAddSubtaskForTaskId(null), [])

  const confirmAddSubtask = useCallback(
    async (input: Omit<CreateSubtaskInput, 'taskId'>) => {
      if (addSubtaskForTaskId === null) return
      const taskId = addSubtaskForTaskId
      setAddSubtaskForTaskId(null)
      const created = await createSubtaskRequest({ ...input, taskId }, getToken)
      if (created) {
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId ? { ...task, subtasks: [...task.subtasks, created] } : task,
          ),
        )
      }
    },
    [addSubtaskForTaskId, getToken],
  )

  const goToSourceConversation = useCallback(
    (task: TaskRecord) => {
      if (task.conversationId === null) return
      navigate('/ai-chat', { state: { conversationId: task.conversationId } })
    },
    [navigate],
  )

  return {
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
  }
}
