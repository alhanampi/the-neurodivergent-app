import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { FiMenu, FiMessageCircle } from 'react-icons/fi'
import { useAiChatTab } from './useAiChatTab'
import { MAX_MESSAGE_LENGTH, MIN_MESSAGES_FOR_PLAN } from './AiChatTab.constants'
import { MessageBubble } from './MessageBubble/MessageBubble'
import { Composer } from './Composer/Composer'
import { ConversationSidebar } from './ConversationSidebar/ConversationSidebar'
import { PlanPreviewCard } from './PlanPreviewCard/PlanPreviewCard'
import {
  ChatContainer,
  EmptyState,
  HeaderRow,
  IconWrapper,
  MessagesArea,
  PlanActionsRow,
  TitleGroup,
  TypingIndicator,
} from './AiChatTab.styles'

// Replaces the previous ComingSoonPlaceholder entirely — see
// useAiChatTab.ts for all the state/effects/handlers this just renders.
export function AiChatTab() {
  const { t } = useTranslation()
  const {
    conversationGroups,
    isConversationsLoading,
    activeConversationId,
    messages,
    isMessagesLoading,
    composerDraft,
    isSending,
    isSidebarOpen,
    pendingDeleteId,
    pendingDeleteTitle,
    planSteps,
    planTaskTitle,
    planTaskDescription,
    isPlanGenerating,
    isCreatingTasks,
    errorMessage,
    setComposerDraft,
    openSidebar,
    closeSidebar,
    selectConversation,
    startNewChat,
    sendMessage,
    convertToPlan,
    updatePlanStepTitle,
    updatePlanStepMinutes,
    removePlanStep,
    updatePlanTaskTitle,
    updatePlanTaskDescription,
    discardPlan,
    sendPlanToTasks,
    startPomodoroFromPlan,
    renameConversation,
    requestDeleteConversation,
    cancelDeleteConversation,
    confirmDeleteConversation,
    dismissError,
  } = useAiChatTab()

  const canConvertToPlan =
    activeConversationId !== null && messages.length >= MIN_MESSAGES_FOR_PLAN && !planSteps
  const isEmpty = messages.length === 0 && !isMessagesLoading

  return (
    <ChatContainer>
      <HeaderRow>
        <IconButton size="small" onClick={openSidebar} aria-label={t('chat.sidebar.toggleLabel')}>
          <FiMenu />
        </IconButton>
        <TitleGroup>
          <IconWrapper>
            <FiMessageCircle />
          </IconWrapper>
          <Typography variant="h5" component="h1">
            {t('chat.title')}
          </Typography>
        </TitleGroup>
      </HeaderRow>

      {errorMessage && (
        <Alert severity="error" onClose={dismissError}>
          {errorMessage}
        </Alert>
      )}

      {isMessagesLoading && <EmptyState>{t('chat.loadingConversation')}</EmptyState>}

      {isEmpty && (
        <EmptyState>
          <Typography variant="subtitle1">{t('chat.emptyState.title')}</Typography>
          <Typography variant="body2">{t('chat.emptyState.description')}</Typography>
        </EmptyState>
      )}

      {!isEmpty && !isMessagesLoading && (
        <MessagesArea>
          {messages.map((message) => (
            <MessageBubble key={message.id} role={message.role} content={message.content} />
          ))}
          {isSending && (
            <TypingIndicator aria-live="polite">{t('chat.assistantTyping')}</TypingIndicator>
          )}
        </MessagesArea>
      )}

      {canConvertToPlan && (
        <PlanActionsRow>
          <Button size="small" onClick={convertToPlan} disabled={isPlanGenerating}>
            {isPlanGenerating ? t('chat.plan.generating') : t('chat.plan.convertButton')}
          </Button>
        </PlanActionsRow>
      )}

      {planSteps && (
        <PlanPreviewCard
          taskTitle={planTaskTitle}
          onTaskTitleChange={updatePlanTaskTitle}
          taskDescription={planTaskDescription}
          onTaskDescriptionChange={updatePlanTaskDescription}
          steps={planSteps}
          onTitleChange={updatePlanStepTitle}
          onMinutesChange={updatePlanStepMinutes}
          onRemoveStep={removePlanStep}
          onDiscard={discardPlan}
          onConfirm={sendPlanToTasks}
          onStartPomodoro={startPomodoroFromPlan}
          isSending={isCreatingTasks}
        />
      )}

      <Composer
        value={composerDraft}
        onChange={setComposerDraft}
        onSend={sendMessage}
        disabled={isSending}
        maxLength={MAX_MESSAGE_LENGTH}
      />

      <ConversationSidebar
        open={isSidebarOpen}
        onClose={closeSidebar}
        groups={conversationGroups}
        activeConversationId={activeConversationId}
        isLoading={isConversationsLoading}
        onSelectConversation={selectConversation}
        onNewChat={startNewChat}
        onRenameConversation={renameConversation}
        pendingDeleteId={pendingDeleteId}
        pendingDeleteTitle={pendingDeleteTitle}
        onRequestDelete={requestDeleteConversation}
        onCancelDelete={cancelDeleteConversation}
        onConfirmDelete={confirmDeleteConversation}
      />
    </ChatContainer>
  )
}
