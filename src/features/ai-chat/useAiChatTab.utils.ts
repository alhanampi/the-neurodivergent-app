import { createDraftId, parseSseChunk } from './AiChatTab.utils'
import type {
  ClientMessage,
  ConversationSummary,
  PlanStepDraft,
  RenamedConversation,
} from './AiChatTab.interfaces'
import type { SupportedLanguage } from '@/i18n/i18n.interfaces'

type GetToken = () => Promise<string | null>

// Every function here swallows failures into a safe default or a
// discriminated {ok:false} result rather than throwing — same convention as
// useTimersTab.utils.ts: no /api backend is reachable under plain
// `npm run dev` (use `vercel dev` for that), and the hook should never need
// a try/catch of its own around ordinary network failures.

export async function fetchConversations(getToken: GetToken): Promise<ConversationSummary[]> {
  try {
    const token = await getToken()
    if (!token) return []

    const response = await fetch('/api/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return []

    const body = (await response.json()) as { conversations?: ConversationSummary[] }
    return body.conversations ?? []
  } catch {
    return []
  }
}

export async function fetchConversationMessages(
  conversationId: number,
  getToken: GetToken,
): Promise<ClientMessage[]> {
  try {
    const token = await getToken()
    if (!token) return []

    const response = await fetch(`/api/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return []

    const body = (await response.json()) as { messages?: ClientMessage[] }
    return body.messages ?? []
  } catch {
    return []
  }
}

export type StreamChatResult =
  | { ok: true; conversationId: number; messageId: number; title?: string }
  | { ok: false; error: string }

/** Streams a chat reply, calling `onToken` for each text chunk as it
 * arrives — resolves once a 'done'/'error' SSE frame is read, the stream
 * ends unexpectedly, or a network exception is caught, always as an
 * {ok:false} result rather than throwing, so useAiChatTab.ts never needs
 * its own try/catch around this call. */
export async function streamChatMessage(
  conversationId: number | null,
  message: string,
  language: SupportedLanguage,
  getToken: GetToken,
  onToken: (value: string) => void,
): Promise<StreamChatResult> {
  try {
    const token = await getToken()
    if (!token) return { ok: false, error: 'not-authenticated' }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, message, language }),
    })

    if (!response.ok || !response.body) {
      return { ok: false, error: 'request-failed' }
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      // Each read depends on the previous one (it's one ordered byte
      // stream) — there's nothing to parallelize here.
      // oxlint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const { frames, remainder } = parseSseChunk(buffer)
      buffer = remainder

      for (const frame of frames) {
        if (frame.type === 'token') {
          onToken(frame.value)
        } else if (frame.type === 'done') {
          return {
            ok: true,
            conversationId: frame.conversationId,
            messageId: frame.messageId,
            title: frame.title,
          }
        } else if (frame.type === 'error') {
          return { ok: false, error: frame.message }
        }
      }
    }

    return { ok: false, error: 'stream-ended-unexpectedly' }
  } catch {
    return { ok: false, error: 'network-error' }
  }
}

export type RequestPlanResult =
  | { ok: true; taskTitle: string; taskDescription: string; steps: PlanStepDraft[] }
  | { ok: false; error: string }

export async function requestPlan(
  conversationId: number,
  language: SupportedLanguage,
  getToken: GetToken,
): Promise<RequestPlanResult> {
  try {
    const token = await getToken()
    if (!token) return { ok: false, error: 'not-authenticated' }

    const response = await fetch('/api/chat-plan', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, language }),
    })

    if (!response.ok) return { ok: false, error: 'request-failed' }

    const body = (await response.json()) as {
      plan?: {
        taskTitle: string
        taskDescription: string
        steps: { title: string; minutes: number }[]
      }
    }
    if (!body.plan) return { ok: false, error: 'request-failed' }

    const steps: PlanStepDraft[] = body.plan.steps.map((step) => ({
      id: createDraftId(),
      title: step.title,
      minutes: step.minutes,
    }))
    return {
      ok: true,
      taskTitle: body.plan.taskTitle,
      taskDescription: body.plan.taskDescription,
      steps,
    }
  } catch {
    return { ok: false, error: 'network-error' }
  }
}

export async function renameConversationRequest(
  conversationId: number,
  title: string,
  getToken: GetToken,
): Promise<RenamedConversation | null> {
  try {
    const token = await getToken()
    if (!token) return null

    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    })
    if (!response.ok) return null

    const body = (await response.json()) as { conversation?: RenamedConversation }
    return body.conversation ?? null
  } catch {
    return null
  }
}

export async function deleteConversationRequest(
  conversationId: number,
  getToken: GetToken,
): Promise<boolean> {
  try {
    const token = await getToken()
    if (!token) return false

    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.ok
  } catch {
    return false
  }
}

export interface CreateTasksFromPlanInput {
  taskTitle: string
  taskDescription: string
  conversationId: number | null
  steps: PlanStepDraft[]
}

export async function createTasksFromPlan(
  input: CreateTasksFromPlanInput,
  getToken: GetToken,
): Promise<boolean> {
  try {
    const token = await getToken()
    if (!token) return false

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: input.taskTitle,
        description: input.taskDescription,
        conversationId: input.conversationId,
        steps: input.steps.map((step) => ({ title: step.title, minutes: step.minutes })),
      }),
    })
    return response.ok
  } catch {
    return false
  }
}
