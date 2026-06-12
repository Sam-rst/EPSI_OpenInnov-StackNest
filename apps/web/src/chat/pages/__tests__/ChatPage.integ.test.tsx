import type { EventSourceMessage, FetchEventSourceInit } from '@microsoft/fetch-event-source'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
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

/** Sonde la localisation courante : le test lit le pathname affiché. */
function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

/**
 * Monte ChatPage derrière les vraies routes `/chat` et `/chat/:id` afin que
 * `useParams()` et `navigate()` se comportent comme en production (fil actif porté
 * par l'URL). Une sonde de localisation permet d'asserter les redirections.
 */
function renderChatAt(path = '/chat') {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/deployments/:id" element={<div>Page déploiement</div>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </Wrapper>,
  )
}

function renderChat() {
  return renderChatAt('/chat')
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

    // Item #7 : un CTA visible « Voir le déploiement → » mène au suivi du
    // déploiement créé (pas de redirection automatique).
    const cta = await screen.findByRole('button', { name: /Voir le déploiement/ })
    await user.click(cta)
    await waitFor(() => {
      expect(screen.getByText('Page déploiement')).toBeInTheDocument()
    })
    expect(screen.getByTestId('location')).toHaveTextContent('/deployments/dep-1')
  })

  it('annonce courtoisement la réflexion (aria-live) et verrouille le composer — F1/A5', async () => {
    const user = userEvent.setup()
    renderChat()
    await screen.findByText(/Décris-moi ton besoin/)
    await waitFor(() => expect(fetchEventSourceMock).toHaveBeenCalled())

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Je veux un Postgres')
    await user.click(screen.getByRole('button', { name: /Envoyer/ }))

    // F1 : la région polie annonce le statut « réfléchit » sans relire le fil.
    await waitFor(() => {
      const live = document.querySelector('[aria-live="polite"]')
      expect(live?.textContent).toMatch(/réfléchit/i)
    })
    // A5 : la saisie est verrouillée tant que la génération est en cours.
    expect(textarea).toBeDisabled()
  })

  it('rejoue la carte de proposition au rechargement (action proposed sur le seed)', async () => {
    // Le détail renvoie un message assistant porteur d'une proposition encore
    // `proposed` : la carte (Confirmer/Modifier/Annuler) doit réapparaître sans
    // qu'aucun événement SSE `action_proposed` ne soit émis.
    server.use(
      http.get('*/chat/conversations/c1', () =>
        HttpResponse.json({
          conversation: DETAIL.conversation,
          messages: [
            {
              id: 'm-act',
              role: 'assistant',
              content: 'Voici ce que je te propose :',
              created_at: '2026-06-08T11:00:00Z',
              action: {
                action_id: 'act-1',
                kind: 'deploy',
                restatement: 'Déployer un PostgreSQL 16 isolé',
                recap: { template: 'PostgreSQL', version: '16', name: 'db', params: {} },
              },
            },
          ],
        }),
      ),
    )
    renderChat()

    expect(await screen.findByText(/Déployer un PostgreSQL 16 isolé/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Confirmer/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Annuler/ })).toBeInTheDocument()
  })

  it('ouvre le fil porté par l’URL /chat/:id (fil actif = paramètre)', async () => {
    renderChatAt('/chat/c1')

    // Le détail du fil c1 est chargé directement à partir de l'id de l'URL.
    expect(await screen.findByText(/Décris-moi ton besoin/)).toBeInTheDocument()
    await waitFor(() => {
      const [url] = fetchEventSourceMock.mock.calls[0] as [string]
      expect(url).toContain('/chat/conversations/c1/stream')
    })
  })

  it('redirige /chat (sans id) vers le fil le plus récent', async () => {
    renderChatAt('/chat')

    // Le fil le plus récent (c1) est ouvert : l'URL bascule vers /chat/c1.
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/chat/c1')
    })
    expect(await screen.findByText(/Décris-moi ton besoin/)).toBeInTheDocument()
  })

  it('sélectionner un fil navigue vers /chat/{id}', async () => {
    const user = userEvent.setup()
    const second = {
      id: 'c2',
      title: 'Redis isolé',
      created_at: '2026-06-07T09:00:00Z',
      updated_at: '2026-06-07T09:30:00Z',
    }
    server.use(
      http.get('*/chat/conversations', () => HttpResponse.json([DETAIL.conversation, second])),
      http.get('*/chat/conversations/c2', () =>
        HttpResponse.json({ conversation: second, messages: [] }),
      ),
    )
    renderChatAt('/chat/c1')
    await screen.findByText(/Décris-moi ton besoin/)

    await user.click(await screen.findByText('Redis isolé'))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/chat/c2')
    })
  })

  it('conserve la carte de proposition après un aller-retour de navigation SPA (Fix 3)', async () => {
    // Le détail REST du fil reste VIDE (le back n'a pas encore persisté la
    // proposition) : la carte ne peut donc survivre au démontage QUE si l'event SSE
    // `action_proposed` a été miroité dans le cache des messages du fil. Avec un
    // cache `staleTime: Infinity`, aucun refetch ne vient écraser ce miroir au
    // remontage — on prouve la persistance par l'état durable, pas par le réseau.
    const user = userEvent.setup()
    const persistentClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    })
    function PersistentWrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={persistentClient}>{children}</QueryClientProvider>
    }

    render(
      <PersistentWrapper>
        <MemoryRouter initialEntries={['/chat/c1']}>
          <Link to="/ailleurs">Aller ailleurs</Link>
          <Link to="/chat/c1">Revenir au chat</Link>
          <Routes>
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/ailleurs" element={<div>Autre page</div>} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </PersistentWrapper>,
    )

    await screen.findByText(/Décris-moi ton besoin/)
    await waitFor(() => expect(fetchEventSourceMock).toHaveBeenCalled())

    // Une proposition arrive par le flux SSE pendant le tour live.
    act(() => {
      emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal())
    })
    expect(await screen.findByText(/Déployer un PostgreSQL 16 isolé/)).toBeInTheDocument()

    // On quitte le chat (ChatPage démonte) puis on y revient (remontage).
    await user.click(screen.getByText('Aller ailleurs'))
    await screen.findByText('Autre page')
    await user.click(screen.getByText('Revenir au chat'))

    // La carte doit réapparaître IMMÉDIATEMENT, sans nouvel `action_proposed`.
    expect(await screen.findByText(/Déployer un PostgreSQL 16 isolé/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Confirmer/ })).toBeEnabled()
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
