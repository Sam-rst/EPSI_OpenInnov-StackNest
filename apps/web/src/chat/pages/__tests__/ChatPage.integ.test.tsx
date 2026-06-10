import type { EventSourceMessage, FetchEventSourceInit } from '@microsoft/fetch-event-source'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { ConversationDetailDTO } from '../../types/dto/ConversationDetailDTO'
import { ChatStreamEventName } from '../../types/models/ChatStreamEvent'
import { ChatPage } from '../ChatPage'

/**
 * On mocke `@microsoft/fetch-event-source` (le flux SSE de la conversation) et le
 * `tokenStore` (Bearer). Le REST `/chat` et `/deployments` passent par MSW. Le
 * scénario complet : liste + amorce → envoi (POST 202) → bulle qui se remplit →
 * carte d'action → confirmation (POST 202) → résultat SSE → statut « Exécutée ».
 */
const { fetchEventSourceMock, getAccessTokenMock } = vi.hoisted(() => ({
  fetchEventSourceMock: vi.fn(),
  getAccessTokenMock: vi.fn(),
}))

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: fetchEventSourceMock,
  EventStreamContentType: 'text/event-stream',
}))

vi.mock('../../../core/api/tokenStore', () => ({ getAccessToken: getAccessTokenMock }))

let capturedInit: FetchEventSourceInit | undefined

/** Promesse jamais résolue : le flux SSE reste « ouvert » sous le contrôle du test. */
function neverResolves(): Promise<void> {
  return new Promise<void>(() => undefined)
}

/** Réponse HTTP minimale acceptée par `onopen` (200 = flux ouvert). */
function openOkResponse(): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null) },
  } as unknown as Response
}

function emit(event: string, data: unknown): void {
  const frame: EventSourceMessage = { id: '', event, data: JSON.stringify(data), retry: undefined }
  capturedInit?.onmessage?.(frame)
}

const DETAIL: ConversationDetailDTO = {
  conversation: {
    id: 'c1',
    title: 'Env de dev Node + Postgres',
    created_at: '2026-06-08T10:00:00Z',
    updated_at: '2026-06-08T11:30:00Z',
  },
  messages: [{ id: 'm1', role: 'assistant', content: 'Décris-moi ton besoin.', created_at: null }],
}

function deployProposal(): Record<string, unknown> {
  return {
    action_id: 'act-1',
    kind: 'deploy',
    restatement: 'Déployer un PostgreSQL 16 isolé',
    recap: { template: 'PostgreSQL', version: '16', name: 'db', params: { db_name: 'app' } },
  }
}

function renderChat() {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/chat']}>
        <ChatPage />
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('ChatPage (parcours chat IA → API REST + SSE)', () => {
  beforeEach(() => {
    capturedInit = undefined
    fetchEventSourceMock.mockReset()
    getAccessTokenMock.mockReset()
    getAccessTokenMock.mockReturnValue('access-jwt')
    fetchEventSourceMock.mockImplementation((_url: string, init: FetchEventSourceInit) => {
      capturedInit = init
      // Le flux s'ouvre immédiatement (onopen 200) : la porte d'envoi (E1) se
      // résout, donc le POST /messages peut partir. Le flux reste ensuite ouvert.
      void init.onopen?.(openOkResponse())
      return neverResolves()
    })

    server.use(
      http.get('*/chat/conversations', () => HttpResponse.json([DETAIL.conversation])),
      http.get('*/chat/conversations/c1', () => HttpResponse.json(DETAIL)),
      http.post('*/chat/conversations/c1/messages', () => new HttpResponse(null, { status: 202 })),
      http.post('*/chat/actions/act-1/confirm', () => new HttpResponse(null, { status: 202 })),
      http.get('*/deployments', () =>
        HttpResponse.json([
          {
            id: 'dep-1',
            template_id: 'pg16',
            template_version: '16',
            name: 'postgres-prod',
            status: 'running',
            params: {},
            host: '10.0.0.5',
            published_port: 32769,
            access_url: '10.0.0.5:32769',
            created_at: '2026-06-08T10:00:00Z',
            updated_at: '2026-06-08T11:00:00Z',
          },
        ]),
      ),
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
    server.resetHandlers()
  })

  it('affiche les 3 colonnes : fils, message d’amorce, déploiements actifs', async () => {
    renderChat()

    expect(await screen.findByText(/Env de dev Node \+ Postgres/)).toBeInTheDocument()
    expect(await screen.findByText(/Décris-moi ton besoin/)).toBeInTheDocument()
    expect(await screen.findByText('postgres-prod')).toBeInTheDocument()
  })

  it('ouvre le flux SSE de la conversation active avec le Bearer', async () => {
    renderChat()
    await screen.findByText(/Décris-moi ton besoin/)

    await waitFor(() => {
      expect(fetchEventSourceMock).toHaveBeenCalled()
    })
    const [url, init] = fetchEventSourceMock.mock.calls[0] as [string, FetchEventSourceInit]
    expect(url).toContain('/chat/conversations/c1/stream')
    expect(init.headers?.Authorization).toBe('Bearer access-jwt')
  })

  it('envoie un message, remplit la bulle puis propose une action confirmable', async () => {
    const user = userEvent.setup()
    renderChat()
    await screen.findByText(/Décris-moi ton besoin/)
    await waitFor(() => expect(fetchEventSourceMock).toHaveBeenCalled())

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Je veux un Postgres isolé')
    await user.click(screen.getByRole('button', { name: /Envoyer/ }))

    expect(screen.getByText('Je veux un Postgres isolé')).toBeInTheDocument()

    act(() => {
      emit(ChatStreamEventName.TOKEN, { delta: 'Je prépare ' })
      emit(ChatStreamEventName.TOKEN, { delta: 'une proposition…' })
    })
    await waitFor(() => {
      expect(screen.getByText(/Je prépare une proposition…/)).toBeInTheDocument()
    })

    act(() => {
      emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal())
    })
    await waitFor(() => {
      expect(screen.getByText(/Déployer un PostgreSQL 16 isolé/)).toBeInTheDocument()
    })
    expect(screen.getByText('db_name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirmer/ })).toBeEnabled()
  })

  it('confirme l’action : le résultat SSE passe la carte « Exécutée »', async () => {
    const user = userEvent.setup()
    renderChat()
    await screen.findByText(/Décris-moi ton besoin/)
    await waitFor(() => expect(fetchEventSourceMock).toHaveBeenCalled())

    await user.type(screen.getByRole('textbox'), 'go')
    await user.click(screen.getByRole('button', { name: /Envoyer/ }))

    act(() => {
      emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal())
    })
    await screen.findByRole('button', { name: /Confirmer/ })

    await user.click(screen.getByRole('button', { name: /Confirmer/ }))

    // Le résultat d'exécution arrive par le flux SSE (pas d'optimisme local).
    act(() => {
      emit(ChatStreamEventName.ACTION_RESULT, {
        action_id: 'act-1',
        kind: 'deploy',
        success: true,
        deployment_id: 'dep-1',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Exécutée')).toBeInTheDocument()
    })
  })

  it('crée une nouvelle conversation', async () => {
    const user = userEvent.setup()
    const newConversation = {
      id: 'c-new',
      title: 'Nouvelle conversation',
      created_at: null,
      updated_at: null,
    }
    let created = false
    server.use(
      // La liste reflète la création (le hook réinvalide après le POST).
      http.get('*/chat/conversations', () =>
        HttpResponse.json(created ? [newConversation, DETAIL.conversation] : [DETAIL.conversation]),
      ),
      http.post('*/chat/conversations', () => {
        created = true
        return HttpResponse.json(newConversation, { status: 201 })
      }),
      http.get('*/chat/conversations/c-new', () =>
        HttpResponse.json({ conversation: newConversation, messages: [] }),
      ),
    )
    renderChat()
    await screen.findByText(/Env de dev Node \+ Postgres/)

    // Avant création : seul le bouton porte ce libellé.
    expect(screen.getAllByText('Nouvelle conversation')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /Nouvelle conversation/ }))

    await waitFor(() => {
      expect(screen.getAllByText('Nouvelle conversation').length).toBeGreaterThan(1)
    })
  })
})
