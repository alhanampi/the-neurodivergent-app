import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { MIN_MESSAGES_FOR_PLAN } from './AiChatTab.constants'
import { groupConversationsByDate } from './AiChatTab.utils'
import {
  createTasksFromPlan,
  deleteConversationRequest,
  fetchConversationMessages,
  fetchConversations,
  renameConversationRequest,
  requestPlan,
  streamChatMessage,
} from './useAiChatTab.utils'
import type { ClientMessage, ConversationSummary, PlanStepDraft } from './AiChatTab.interfaces'
import type { SupportedLanguage } from '@/i18n/i18n.interfaces'

export function useAiChatTab() {
  const { t, i18n } = useTranslation()
  const { isSignedIn, getToken } = useAuth()
  const navigate = useNavigate()

  // SUPPORTED_LANGUAGES is only ever 'en'/'es' in this app (see
  // src/i18n/i18n.ts) — normalized explicitly rather than cast, so an
  // unexpected value falls back to 'en' instead of reaching the API.
  const language: SupportedLanguage = i18n.language === 'es' ? 'es' : 'en'

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isConversationsLoading, setIsConversationsLoading] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [composerDraft, setComposerDraftState] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [planSteps, setPlanSteps] = useState<PlanStepDraft[] | null>(null)
  const [isPlanGenerating, setIsPlanGenerating] = useState(false)
  const [isCreatingTasks, setIsCreatingTasks] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false
    setIsConversationsLoading(true)
    void fetchConversations(getToken).then((result) => {
      if (cancelled) return
      setConversations(result)
      setIsConversationsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken])

  const dateGroups = useMemo(
    () => groupConversationsByDate(conversations, new Date()),
    [conversations],
  )

  const setComposerDraft = useCallback((value: string) => setComposerDraftState(value), [])
  const openSidebar = useCallback(() => setIsSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const dismissError = useCallback(() => setErrorMessage(null), [])

  // Fetching messages is owned by the handler that changes
  // activeConversationId, not a useEffect keyed on it — deliberately.
  // sendMessage's own success path also sets activeConversationId (a
  // brand-new conversation's id, once Groq assigns one), and an effect
  // watching that id would have re-fetched and clobbered the just-streamed
  // reply already sitting correctly in `messages` with a fresh (and, in the
  // instant right after sending, likely stale) server round trip. Guarded
  // by a ref so an in-flight fetch for a since-abandoned selection can't
  // resolve out of order and overwrite a newer one.
  const latestRequestedConversationIdRef = useRef<number | null>(null)

  const loadConversationMessages = useCallback(
    async (id: number) => {
      latestRequestedConversationIdRef.current = id
      setMessages([])
      setIsMessagesLoading(true)
      const result = await fetchConversationMessages(id, getToken)
      if (latestRequestedConversationIdRef.current !== id) return
      setMessages(result)
      setIsMessagesLoading(false)
    },
    [getToken],
  )

  const selectConversation = useCallback(
    (id: number) => {
      setActiveConversationId(id)
      setPlanSteps(null)
      setIsSidebarOpen(false)
      void loadConversationMessages(id)
    },
    [loadConversationMessages],
  )

  const startNewChat = useCallback(() => {
    latestRequestedConversationIdRef.current = null
    setActiveConversationId(null)
    setMessages([])
    setPlanSteps(null)
    setIsSidebarOpen(false)
  }, [])

  const sendMessage = useCallback(async () => {
    const text = composerDraft.trim()
    if (text.length === 0 || isSending) return

    setComposerDraftState('')
    setIsSending(true)
    setErrorMessage(null)

    // Optimistic placeholders — negative ids so they can never collide with
    // a real server-assigned message id, which the 'done' frame swaps in.
    const userMessage: ClientMessage = {
      id: -Date.now(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    const placeholderId = -Date.now() - 1
    const assistantPlaceholder: ClientMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, userMessage, assistantPlaceholder])

    const result = await streamChatMessage(
      activeConversationId,
      text,
      language,
      getToken,
      (token) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === placeholderId
              ? { ...message, content: message.content + token }
              : message,
          ),
        )
      },
    )

    if (result.ok) {
      setMessages((current) =>
        current.map((message) =>
          message.id === placeholderId ? { ...message, id: result.messageId } : message,
        ),
      )

      if (activeConversationId === null) {
        setActiveConversationId(result.conversationId)
        setConversations((current) => [
          {
            id: result.conversationId,
            title: result.title ?? 'New conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 2,
          },
          ...current,
        ])
      } else {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === result.conversationId
              ? {
                  ...conversation,
                  updatedAt: new Date().toISOString(),
                  messageCount: conversation.messageCount + 2,
                }
              : conversation,
          ),
        )
      }
    } else {
      // Only the assistant's placeholder is rolled back — the user's own
      // message was already saved server-side before the Groq call even
      // started (see api/chat.ts's write sequencing), so it stays visible
      // and isn't lost or duplicated if the user tries again.
      setMessages((current) => current.filter((message) => message.id !== placeholderId))
      setErrorMessage(t('chat.error.sendFailed'))
    }

    setIsSending(false)
  }, [composerDraft, isSending, activeConversationId, language, getToken, t])

  const convertToPlan = useCallback(async () => {
    if (activeConversationId === null || messages.length < MIN_MESSAGES_FOR_PLAN) return

    setIsPlanGenerating(true)
    setErrorMessage(null)

    const result = await requestPlan(activeConversationId, language, getToken)
    if (result.ok) {
      setPlanSteps(result.steps)
    } else {
      setErrorMessage(t('chat.plan.error'))
    }
    setIsPlanGenerating(false)
  }, [activeConversationId, messages.length, language, getToken, t])

  const updatePlanStepTitle = useCallback((id: string, title: string) => {
    setPlanSteps((current) =>
      current ? current.map((step) => (step.id === id ? { ...step, title } : step)) : current,
    )
  }, [])

  const updatePlanStepMinutes = useCallback((id: string, minutes: number) => {
    setPlanSteps((current) =>
      current ? current.map((step) => (step.id === id ? { ...step, minutes } : step)) : current,
    )
  }, [])

  const removePlanStep = useCallback((id: string) => {
    setPlanSteps((current) => (current ? current.filter((step) => step.id !== id) : current))
  }, [])

  const discardPlan = useCallback(() => setPlanSteps(null), [])

  const sendPlanToTasks = useCallback(async () => {
    if (!planSteps || planSteps.length === 0) return

    setIsCreatingTasks(true)
    setErrorMessage(null)

    const success = await createTasksFromPlan(planSteps, getToken)
    setIsCreatingTasks(false)

    if (success) {
      setPlanSteps(null)
      navigate('/tasks')
    } else {
      setErrorMessage(t('chat.plan.error'))
    }
  }, [planSteps, getToken, navigate, t])

  const renameConversation = useCallback(
    async (id: number, title: string) => {
      const renamed = await renameConversationRequest(id, title, getToken)
      if (!renamed) return
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === id
            ? { ...conversation, title: renamed.title, updatedAt: renamed.updatedAt }
            : conversation,
        ),
      )
    },
    [getToken],
  )

  const requestDeleteConversation = useCallback((id: number) => setPendingDeleteId(id), [])
  const cancelDeleteConversation = useCallback(() => setPendingDeleteId(null), [])

  const confirmDeleteConversation = useCallback(async () => {
    if (pendingDeleteId === null) return
    const id = pendingDeleteId
    setPendingDeleteId(null)

    const success = await deleteConversationRequest(id, getToken)
    if (!success) return

    setConversations((current) => current.filter((conversation) => conversation.id !== id))
    if (activeConversationId === id) {
      latestRequestedConversationIdRef.current = null
      setActiveConversationId(null)
      setMessages([])
      setPlanSteps(null)
    }
  }, [pendingDeleteId, getToken, activeConversationId])

  const pendingDeleteTitle = useMemo(
    () => conversations.find((conversation) => conversation.id === pendingDeleteId)?.title ?? null,
    [conversations, pendingDeleteId],
  )

  return {
    conversationGroups: dateGroups,
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
    discardPlan,
    sendPlanToTasks,
    renameConversation,
    requestDeleteConversation,
    cancelDeleteConversation,
    confirmDeleteConversation,
    dismissError,
  }
}
