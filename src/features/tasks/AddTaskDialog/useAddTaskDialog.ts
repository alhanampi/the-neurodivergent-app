import { useEffect, useState } from 'react'
import { DEFAULT_TASK_PRIORITY } from '../TasksTab.constants'
import type { TaskPriority } from '../TasksTab.interfaces'
import type { CreateTaskInput } from '../useTasksTab.utils'
import type { AddTaskDialogProps, UseAddTaskDialogResult } from './AddTaskDialog.interfaces'

// Draft state resets every time the dialog opens — same "never let a
// leftover draft from a cancelled popup silently attach to the next
// created item" reasoning as AddTimerDialog's nameDraft/minutes reset.
export function useAddTaskDialog({
  open,
  onConfirm,
}: Pick<AddTaskDialogProps, 'open' | 'onConfirm'>): UseAddTaskDialogResult {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(DEFAULT_TASK_PRIORITY)
  const [dueDate, setDueDate] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setPriority(DEFAULT_TASK_PRIORITY)
    setDueDate(null)
  }, [open])

  const canConfirm = title.trim().length > 0

  const handleConfirm = () => {
    if (!canConfirm) return
    const input: CreateTaskInput = {
      title: title.trim(),
      description: description.trim().length > 0 ? description.trim() : null,
      priority,
      dueDate,
      steps: [],
    }
    onConfirm(input)
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    canConfirm,
    handleConfirm,
  }
}
