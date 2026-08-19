import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/i18n'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { AiChatTab } from './AiChatTab'
import type {
  ClientMessage,
  ConversationSummary,
  RenamedConversation,
} from './AiChatTab.interfaces'

const mockGetToken = vi.fn(async () => 'token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn: true, getToken: mockGetToken }),
}))

const mockFetchConversations = vi.fn(
  async (_getToken: unknown): Promise<ConversationSummary[]> => [],
)
const mockFetchConversationMessages = vi.fn(
  async (_id: unknown, _getToken: unknown): Promise<ClientMessage[]> => [],
)
const mockStreamChatMessage = vi.fn(
  async (
    _conversationId: unknown,
    _message: unknown,
    _language: unknown,
    _getToken: unknown,
    onToken: (value: string) => void,
  ) => {
    onToken('Sure')
    onToken(", let's break that down.")
    return { ok: true, conversationId: 1, messageId: 2 }
  },
)
const mockRequestPlan = vi.fn(async (_id: unknown, _language: unknown, _getToken: unknown) => ({
  ok: true,
  taskTitle: 'Clean kitchen',
  taskDescription: 'A few quick steps.',
  steps: [{ id: 's1', title: 'Step one', minutes: 5 }],
}))
const mockRenameConversationRequest = vi.fn(
  async (_id: unknown, _title: unknown, _getToken: unknown): Promise<RenamedConversation | null> =>
    null,
)
const mockDeleteConversationRequest = vi.fn(
  async (_id: unknown, _getToken: unknown): Promise<boolean> => true,
)
const mockCreateTasksFromPlan = vi.fn(
  async (_steps: unknown, _getToken: unknown): Promise<boolean> => true,
)

vi.mock('./useAiChatTab.utils', () => ({
  fetchConversations: (getToken: unknown) => mockFetchConversations(getToken),
  fetchConversationMessages: (id: unknown, getToken: unknown) =>
    mockFetchConversationMessages(id, getToken),
  streamChatMessage: (
    conversationId: unknown,
    message: unknown,
    language: unknown,
    getToken: unknown,
    onToken: (value: string) => void,
  ) => mockStreamChatMessage(conversationId, message, language, getToken, onToken),
  requestPlan: (id: unknown, language: unknown, getToken: unknown) =>
    mockRequestPlan(id, language, getToken),
  renameConversationRequest: (id: unknown, title: unknown, getToken: unknown) =>
    mockRenameConversationRequest(id, title, getToken),
  deleteConversationRequest: (id: unknown, getToken: unknown) =>
    mockDeleteConversationRequest(id, getToken),
  createTasksFromPlan: (steps: unknown, getToken: unknown) =>
    mockCreateTasksFromPlan(steps, getToken),
}))

function renderChatTab() {
  return render(
    <MemoryRouter>
      <ThemeModeProvider>
        <AiChatTab />
      </ThemeModeProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  void i18n.changeLanguage('en')
  vi.clearAllMocks()
})

describe('AiChatTab', () => {
  it('shows the empty state with no conversation started', async () => {
    renderChatTab()

    expect(await screen.findByText('What are you working on?')).toBeInTheDocument()
  })

  it('sends a message and renders the streamed reply', async () => {
    const user = userEvent.setup()
    renderChatTab()

    await user.type(
      screen.getByPlaceholderText("Tell me what you're working on…"),
      'Help me clean the kitchen',
    )
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText("Sure, let's break that down.")).toBeInTheDocument()
    expect(screen.getByText('Help me clean the kitchen')).toBeInTheDocument()
  })

  it('shows "Convert to plan" once there are enough messages, and renders the plan card', async () => {
    const user = userEvent.setup()
    renderChatTab()

    await user.type(
      screen.getByPlaceholderText("Tell me what you're working on…"),
      'Help me clean the kitchen',
    )
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText("Sure, let's break that down.")

    await user.click(screen.getByRole('button', { name: 'Convert to plan' }))

    expect(await screen.findByDisplayValue('Step one')).toBeInTheDocument()
  })

  it('lists conversations in the sidebar, grouped by recency', async () => {
    const user = userEvent.setup()
    mockFetchConversations.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Older chat',
        createdAt: new Date(2020, 0, 1).toISOString(),
        updatedAt: new Date(2020, 0, 1).toISOString(),
        messageCount: 2,
      },
    ])
    renderChatTab()

    await user.click(screen.getByRole('button', { name: 'Open conversations' }))

    expect(await screen.findByText('Older chat')).toBeInTheDocument()
    expect(screen.getByText('Older')).toBeInTheDocument()
  })
})
