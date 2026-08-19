import { getUserIdFromRequest } from './_lib/auth.utils.js'
import { createGroqClient } from './_lib/groq.client.js'
import { GROQ_MODEL } from './_lib/groq.constants.js'
import { getOwnedConversation } from './_lib/conversations.utils.js'
import { CHAT_MAX_TOKENS, CHAT_TEMPERATURE } from './_lib/chat.constants.js'
import {
  buildSystemPrompt,
  createConversation,
  deriveConversationTitle,
  fetchConversationHistory,
  insertAssistantMessage,
  insertUserMessage,
  parseChatRequestBody,
  touchConversation,
  writeSseFrame,
} from './_lib/chat.utils.js'
import type { VercelApiRequest, VercelApiResponse } from './_lib/vercel-http.interfaces.js'

// Streams a reply for a given (or brand-new) conversation. Not JSON-enveloped
// like every other route in this project — this is the first /api response
// shape here that's Server-Sent Events instead, since the ROADMAP explicitly
// calls for "streaming back-and-forth". See chat.utils.ts's writeSseFrame
// for the frame shape and AiChatTab.utils.ts's parseSseChunk for the client
// side.
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

  const body = parseChatRequestBody(req.body)
  if (!body) {
    res.status(400).json({ error: 'Invalid chat request' })
    return
  }

  let conversationId: number
  let isNewConversation = false
  let title: string | undefined

  if (body.conversationId !== null) {
    const owned = await getOwnedConversation(userId, body.conversationId)
    if (!owned) {
      res.status(404).json({ error: 'Conversation not found' })
      return
    }
    conversationId = owned.id
  } else {
    title = deriveConversationTitle(body.message)
    conversationId = await createConversation(userId, title)
    isNewConversation = true
  }

  // Saved before calling Groq at all — a failure below this point never
  // loses what the user typed, since it's already in the conversation for
  // a retry (see ROADMAP.md's iteration 8 notes on write sequencing).
  await insertUserMessage(conversationId, body.message)

  const history = await fetchConversationHistory(conversationId)
  const groqMessages = [
    { role: 'system' as const, content: buildSystemPrompt(body.language) },
    ...history,
  ]

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  let fullReply = ''
  try {
    const stream = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages,
      stream: true,
      temperature: CHAT_TEMPERATURE,
      max_tokens: CHAT_MAX_TOKENS,
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? ''
      if (text) {
        fullReply += text
        writeSseFrame(res, { type: 'token', value: text })
      }
    }

    if (fullReply.length === 0) {
      throw new Error('Empty reply from Groq')
    }

    const messageId = await insertAssistantMessage(conversationId, fullReply)
    await touchConversation(conversationId)
    writeSseFrame(res, {
      type: 'done',
      conversationId,
      messageId,
      title: isNewConversation ? title : undefined,
    })
  } catch (error) {
    // Never leak the raw Groq/network error to the client — just a generic,
    // friendly message. The real cause is logged server-side for debugging.
    console.error('Groq chat completion failed:', error)
    writeSseFrame(res, {
      type: 'error',
      message: 'The assistant had trouble responding. Please try again.',
    })
  } finally {
    res.end()
  }
}
