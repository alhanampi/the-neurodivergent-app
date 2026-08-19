import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createTasksFromPlan,
  deleteConversationRequest,
  fetchConversationMessages,
  fetchConversations,
  renameConversationRequest,
  requestPlan,
  streamChatMessage,
} from './useAiChatTab.utils'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response
}

function streamResponse(chunks: string[], ok = true): Response {
  const encoder = new TextEncoder()
  let index = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]))
        index += 1
      } else {
        controller.close()
      }
    },
  })
  return { ok, body: stream } as unknown as Response
}

describe('fetchConversations', () => {
  it('returns [] without calling fetch when there is no token', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchConversations(async () => null)).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the conversations on success', async () => {
    const conversations = [{ id: 1, title: 'A', createdAt: 'x', updatedAt: 'x', messageCount: 2 }]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ conversations })),
    )

    expect(await fetchConversations(async () => 'token')).toEqual(conversations)
  })

  it('returns [] when the response is not ok or fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(await fetchConversations(async () => 'token')).toEqual([])

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    expect(await fetchConversations(async () => 'token')).toEqual([])
  })
})

describe('fetchConversationMessages', () => {
  it('returns the messages on success', async () => {
    const messages = [{ id: 1, role: 'user', content: 'hi', createdAt: 'x' }]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ messages })),
    )

    expect(await fetchConversationMessages(1, async () => 'token')).toEqual(messages)
  })

  it('returns [] on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(await fetchConversationMessages(1, async () => 'token')).toEqual([])
  })
})

describe('streamChatMessage', () => {
  it('returns not-authenticated without calling fetch when there is no token', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await streamChatMessage(
      null,
      'hi',
      'en',
      async () => null,
      () => {},
    )

    expect(result).toEqual({ ok: false, error: 'not-authenticated' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('streams tokens and resolves on the done frame', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        streamResponse([
          'data: {"type":"token","value":"Hi"}\n\n',
          'data: {"type":"token","value":" there"}\n\n',
          'data: {"type":"done","conversationId":1,"messageId":2}\n\n',
        ]),
      ),
    )

    const tokens: string[] = []
    const result = await streamChatMessage(
      null,
      'hi',
      'en',
      async () => 'token',
      (t) => tokens.push(t),
    )

    expect(tokens).toEqual(['Hi', ' there'])
    expect(result).toEqual({ ok: true, conversationId: 1, messageId: 2, title: undefined })
  })

  it('resolves ok:false on an error frame', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse(['data: {"type":"error","message":"oops"}\n\n'])),
    )

    const result = await streamChatMessage(
      null,
      'hi',
      'en',
      async () => 'token',
      () => {},
    )

    expect(result).toEqual({ ok: false, error: 'oops' })
  })

  it('resolves ok:false when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )

    const result = await streamChatMessage(
      null,
      'hi',
      'en',
      async () => 'token',
      () => {},
    )

    expect(result).toEqual({ ok: false, error: 'request-failed' })
  })

  it('resolves ok:false on a network exception, never throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )

    const result = await streamChatMessage(
      null,
      'hi',
      'en',
      async () => 'token',
      () => {},
    )

    expect(result).toEqual({ ok: false, error: 'network-error' })
  })
})

describe('requestPlan', () => {
  it('returns the parsed steps on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ plan: { steps: [{ title: 'Step', minutes: 5 }] } })),
    )

    const result = await requestPlan(1, 'en', async () => 'token')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.steps).toHaveLength(1)
      expect(result.steps[0]).toMatchObject({ title: 'Step', minutes: 5 })
      expect(typeof result.steps[0].id).toBe('string')
    }
  })

  it('returns ok:false on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    const result = await requestPlan(1, 'en', async () => 'token')
    expect(result).toEqual({ ok: false, error: 'request-failed' })
  })
})

describe('renameConversationRequest', () => {
  it('returns the renamed conversation on success', async () => {
    const conversation = { id: 1, title: 'New title', updatedAt: 'x' }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ conversation })),
    )

    expect(await renameConversationRequest(1, 'New title', async () => 'token')).toEqual(
      conversation,
    )
  })

  it('returns null on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(await renameConversationRequest(1, 'New title', async () => 'token')).toBeNull()
  })
})

describe('deleteConversationRequest', () => {
  it('returns true on success, false on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(null)),
    )
    expect(await deleteConversationRequest(1, async () => 'token')).toBe(true)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(null, false)),
    )
    expect(await deleteConversationRequest(1, async () => 'token')).toBe(false)
  })
})

describe('createTasksFromPlan', () => {
  it('returns true on success, false on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ tasks: [] })),
    )
    expect(
      await createTasksFromPlan([{ id: 'a', title: 'Step', minutes: 5 }], async () => 'token'),
    ).toBe(true)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false)),
    )
    expect(
      await createTasksFromPlan([{ id: 'a', title: 'Step', minutes: 5 }], async () => 'token'),
    ).toBe(false)
  })
})
