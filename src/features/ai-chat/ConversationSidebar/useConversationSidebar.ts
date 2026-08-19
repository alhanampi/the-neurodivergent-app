import { useCallback, useState } from 'react'

/** The only local state this component owns — which conversation (if any)
 * is mid-rename, and its draft text. The actual PUT call is delegated to a
 * prop callback (onRenameConversation, ultimately useAiChatTab's rename
 * handler) — this hook is pure local UI state, not app data. */
export function useConversationSidebar(onRenameConversation: (id: number, title: string) => void) {
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  const startRename = useCallback((id: number, currentTitle: string) => {
    setRenamingId(id)
    setRenameDraft(currentTitle)
  }, [])

  const cancelRename = useCallback(() => {
    setRenamingId(null)
    setRenameDraft('')
  }, [])

  const confirmRename = useCallback(() => {
    const trimmed = renameDraft.trim()
    if (renamingId !== null && trimmed.length > 0) {
      onRenameConversation(renamingId, trimmed)
    }
    setRenamingId(null)
    setRenameDraft('')
  }, [renamingId, renameDraft, onRenameConversation])

  return { renamingId, renameDraft, setRenameDraft, startRename, cancelRename, confirmRename }
}
