import { getUserIdFromRequest } from './_lib/auth.utils.js'
import { createGroqClient } from './_lib/groq.client.js'
import { GROQ_MODEL } from './_lib/groq.constants.js'
import { getOwnedConversation } from './_lib/conversations.utils.js'
import { fetchConversationHistory } from './_lib/chat.utils.js'
import { PLAN_MAX_TOKENS, PLAN_TEMPERATURE } from './_lib/chat-plan.constants.js'
import {
  buildPlanSystemPrompt,
  parseChatPlanRequestBody,
  parsePlanResponse,
} from './_lib/chat-plan.utils.js'
import type { VercelApiRequest, VercelApiResponse } from './_lib/vercel-http.interfaces.js'

// A separate, non-streaming, JSON-mode call over an existing conversation's
// history — deliberately not part of api/chat.ts's streaming turn, and
// never appended to the conversation as a message (see ROADMAP.md's
// iteration 8 notes: "convert to plan" is an explicit action, not embedded
// in the free-text chat). No DB writes here at all — the resulting plan is
// a transient client-side draft until the user confirms it via
// POST /api/tasks.
export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const groqClient = createGroqClient()
  if (!groqClient) {
    res.status(500).json({ error: 'Chat is not configured' })
    return
  }

  const body = parseChatPlanRequestBody(req.body)
  if (!body) {
    res.status(400).json({ error: 'Invalid request' })
    return
  }

  const owned = await getOwnedConversation(userId, body.conversationId)
  if (!owned) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  const history = await fetchConversationHistory(body.conversationId)
  const groqMessages = [
    { role: 'system' as const, content: buildPlanSystemPrompt(body.language) },
    ...history,
  ]

  try {
    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature: PLAN_TEMPERATURE,
      max_tokens: PLAN_MAX_TOKENS,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const plan = parsePlanResponse(raw)
    if (!plan) {
      res.status(502).json({ error: 'Could not build a plan from this conversation yet.' })
      return
    }

    res.status(200).json({ plan })
  } catch (error) {
    console.error('Groq plan completion failed:', error)
    res.status(502).json({ error: 'Could not build a plan from this conversation yet.' })
  }
}
