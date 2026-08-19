import { useEffect, useState } from 'react'
import { DEFAULT_TASK_PRIORITY } from '../TasksTab.constants'
import type { TaskPriority } from '../TasksTab.interfaces'
import type {
  AddSubtaskDialogProps,
  UseAddSubtaskDialogResult,
} from './AddSubtaskDialog.interfaces'

const DEFAULT_MINUTES = 10

export function useAddSubtaskDialog({
  open,
  onConfirm,
}: Pick<AddSubtaskDialogProps, 'open' | 'onConfirm'>): UseAddSubtaskDialogResult {
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES)
  const [priority, setPriority] = useState<TaskPriority>(DEFAULT_TASK_PRIORITY)
  const [dueDate, setDueDate] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setMinutes(DEFAULT_MINUTES)
    setPriority(DEFAULT_TASK_PRIORITY)
    setDueDate(null)
  }, [open])

  const canConfirm = title.trim().length > 0

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({ title: title.trim(), minutes, priority, dueDate })
  }

  return {
    title,
    setTitle,
    minutes,
    setMinutes,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    canConfirm,
    handleConfirm,
  }
}
