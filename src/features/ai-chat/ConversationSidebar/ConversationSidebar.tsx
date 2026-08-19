import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FiCheck, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { useConversationSidebar } from './useConversationSidebar'
import { DeleteConversationDialog } from './DeleteConversationDialog/DeleteConversationDialog'
import {
  ConversationRow,
  ConversationTitle,
  DrawerContent,
  GroupLabel,
  SidebarEmpty,
  SidebarHeader,
} from './ConversationSidebar.styles'
import type { ConversationSidebarProps } from './ConversationSidebar.interfaces'

export function ConversationSidebar({
  open,
  onClose,
  groups,
  activeConversationId,
  isLoading,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  pendingDeleteId,
  pendingDeleteTitle,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ConversationSidebarProps) {
  const { t } = useTranslation()
  const { renamingId, renameDraft, setRenameDraft, startRename, cancelRename, confirmRename } =
    useConversationSidebar(onRenameConversation)

  const hasAnyConversation = groups.some((group) => group.conversations.length > 0)

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <SidebarHeader>
          <Typography variant="subtitle1">{t('chat.sidebar.title')}</Typography>
          <Button size="small" startIcon={<FiPlus />} onClick={onNewChat}>
            {t('chat.newChat')}
          </Button>
        </SidebarHeader>

        {isLoading && <SidebarEmpty>{t('chat.sidebar.loading')}</SidebarEmpty>}
        {!isLoading && !hasAnyConversation && (
          <SidebarEmpty>{t('chat.sidebar.empty')}</SidebarEmpty>
        )}

        {!isLoading &&
          groups.map((group) => (
            <div key={group.labelKey}>
              <GroupLabel>{t(group.labelKey)}</GroupLabel>
              {group.conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  $active={conversation.id === activeConversationId}
                >
                  {renamingId === conversation.id ? (
                    <>
                      <TextField
                        size="small"
                        value={renameDraft}
                        onChange={(event) => setRenameDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') confirmRename()
                          if (event.key === 'Escape') cancelRename()
                        }}
                      />
                      <IconButton
                        size="small"
                        aria-label={t('chat.sidebar.renameSave')}
                        onClick={confirmRename}
                      >
                        <FiCheck size={14} />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={t('chat.sidebar.renameCancel')}
                        onClick={cancelRename}
                      >
                        <FiX size={14} />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <ConversationTitle onClick={() => onSelectConversation(conversation.id)}>
                        {conversation.title}
                      </ConversationTitle>
                      <IconButton
                        size="small"
                        aria-label={t('chat.sidebar.renameLabel')}
                        onClick={() => startRename(conversation.id, conversation.title)}
                      >
                        <FiEdit2 size={14} />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={t('chat.sidebar.deleteLabel')}
                        onClick={() => onRequestDelete(conversation.id)}
                      >
                        <FiTrash2 size={14} />
                      </IconButton>
                    </>
                  )}
                </ConversationRow>
              ))}
            </div>
          ))}
      </DrawerContent>

      <DeleteConversationDialog
        open={pendingDeleteId !== null}
        conversationTitle={pendingDeleteTitle}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </Drawer>
  )
}
