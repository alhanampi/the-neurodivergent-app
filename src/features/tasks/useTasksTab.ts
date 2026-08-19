import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { deleteTaskRequest, fetchTasks, patchTaskCompleted } from './useTasksTab.utils'
import type { TaskRecord } from './TasksTab.interfaces'

export function useTasksTab() {
  const { isSignedIn, getToken } = useAuth()

  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

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

  // Optimistic toggle with rollback on failure — flips the checkbox
  // immediately, then reconciles with the server's response (or reverts if
  // the request failed), same pattern flagged as worth imitating from the
  // reference app's chat send flow.
  const toggleTask = useCallback(
    (id: number) => {
      const target = tasks.find((task) => task.id === id)
      if (!target) return
      const nextCompleted = !target.completed

      setTasks((current) =>
        current.map((task) =>
          task.id === id
            ? {
                ...task,
                completed: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : null,
              }
            : task,
        ),
      )

      void patchTaskCompleted(id, nextCompleted, getToken).then((updated) => {
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== id) return task
            return (
              updated ?? { ...task, completed: target.completed, completedAt: target.completedAt }
            )
          }),
        )
      })
    },
    [tasks, getToken],
  )

  const deleteTask = useCallback(
    (id: number) => {
      const removed = tasks.find((task) => task.id === id)
      setTasks((current) => current.filter((task) => task.id !== id))

      void deleteTaskRequest(id, getToken).then((success) => {
        if (!success && removed) {
          // Failed — put it back. Exact position isn't preserved, just
          // presence; a reload would put it back in the right place anyway.
          setTasks((current) => [...current, removed])
        }
      })
    },
    [tasks, getToken],
  )

  return { tasks, isLoading, hasLoadedOnce, toggleTask, deleteTask }
}
