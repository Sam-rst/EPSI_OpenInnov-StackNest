import type { EventSourceMessage, FetchEventSourceInit } from '@microsoft/fetch-event-source'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ActionStatus } from '../../types/enums/ActionStatus'
import { MessageRole } from '../../types/enums/MessageRole'
import { ChatStreamEventName } from '../../types/models/ChatStreamEvent'
import type { Conversation } from '../../types/models/Conversation'
import { CHAT_QUERY_KEYS } from '../chatQueryKeys'
import { useChatStream } from '../useChatStream'

// `useChatStream` lit le `QueryClient` (invalidation de la liste des conversations
// au titre auto) : tout rendu de hook doit donc fournir un `QueryClientProvider`.
const testQueryClient = new QueryClient()
function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: testQueryClient }, children)
}

/**
 * On mocke `@microsoft/fetch-event-source` (flux SSE), le `tokenStore` (Bearer), le
 * `refreshSession` (refresh sur 401) et le service REST (`sendMessage`). Chaque
 * ouverture crée une `FakeStream` pilotable : on choisit QUAND le flux s'ouvre
 * (`open(200)`), on émet `token`/`message`/`action_*`/`error`, on simule un 401 ou
 * une coupure réseau (`fail`), on abandonne — sans réseau ni `EventSource` natif.
 *
 * La machine d'état est le cœur testé ici (contrat `ChatStreamState`) : transitions
 * idle→thinking→streaming→done, erreurs typées par catégorie, reconnexion bornée
 * avec backoff, course du 1er message (POST après ouverture du flux), stop, canSend,
 * retry, sans perte du message.
 */
const { fetchEventSourceMock, refreshAccessTokenMock, getAccessTokenMock, sendMessageMock } =
  vi.hoisted(() => ({
    fetchEventSourceMock: vi.fn(),
    refreshAccessTokenMock: vi.fn(),
    getAccessTokenMock: vi.fn(),
    sendMessageMock: vi.fn(),
  }))

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: fetchEventSourceMock,
  EventStreamContentType: 'text/event-stream',
}))

vi.mock('../../../core/api/tokenStore', () => ({ getAccessToken: getAccessTokenMock }))
vi.mock('../../../core/api/refreshSession', () => ({ refreshAccessToken: refreshAccessTokenMock }))
vi.mock('../../services/chatService', () => ({ sendMessage: sendMessageMock }))

/**
 * Flux SSE simulé. `open(status)` joue `onopen` (la promesse d'ouverture résout sur
 * succès, rejette sur 401/erreur HTTP) ; `fail(error)` joue `onerror` (coupure).
 */
class FakeStream {
  static instances: FakeStream[] = []

  readonly url: string
  readonly init: FetchEventSourceInit
  private resolve!: () => void
  private reject!: (error: unknown) => void
  readonly promise: Promise<void>

  constructor(url: string, init: FetchEventSourceInit) {
    this.url = url
    this.init = init
    this.promise = new Promise<void>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    init.signal?.addEventListener('abort', () => this.resolve())
    FakeStream.instances.push(this)
  }

  open(status: number): void {
    try {
      const result = this.init.onopen?.(httpResponse(status))
      void Promise.resolve(result).catch((error) => this.fail(error))
    } catch (error) {
      this.fail(error)
    }
  }

  emit(event: string, data: unknown): void {
    this.init.onmessage?.(sseFrame(event, data))
  }

  /** Simule une coupure réseau / erreur du flux : joue `onerror` (qui relève). */
  fail(error: unknown): void {
    try {
      this.init.onerror?.(error)
    } catch (rethrown) {
      this.reject(rethrown)
    }
  }
}

function httpResponse(status: number): Response {
  const contentType = status === 200 ? 'text/event-stream' : 'application/json'
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name === 'content-type' ? contentType : null) },
  } as unknown as Response
}

function sseFrame(event: string, data: unknown): EventSourceMessage {
  return { id: '', event, data: JSON.stringify(data), retry: undefined }
}

function lastStream(): FakeStream {
  const stream = FakeStream.instances.at(-1)
  if (stream === undefined) {
    throw new Error('Aucun flux fetchEventSource ouvert.')
  }
  return stream
}

function deployProposal(): Record<string, unknown> {
  return {
    action_id: 'act-1',
    kind: 'deploy',
    restatement: 'Déployer un Postgres',
    recap: { template: 'PostgreSQL', version: '16', name: 'db', params: {} },
  }
}

function stackProposal(): Record<string, unknown> {
  return {
    action_id: 'act-stack',
    kind: 'compose_stack',
    restatement: 'Composer la stack « mon-app » (2 services : db, api).',
    recap: {
      name: 'mon-app',
      services: [
        { alias: 'db', version: '16' },
        { alias: 'api', version: '20' },
      ],
      links: [{ from: 'api', to: 'db' }],
    },
  }
}

/** Ouvre le flux courant (succès 200) puis envoie un message ; renvoie le flux. */
async function sendAfterOpen(
  send: (content: string) => void,
  content: string,
): Promise<FakeStream> {
  const stream = lastStream()
  await act(async () => {
    stream.open(200)
  })
  act(() => send(content))
  await waitFor(() => expect(sendMessageMock).toHaveBeenCalled())
  return stream
}

describe('useChatStream (machine d’état + résilience SSE sur /chat)', () => {
  beforeEach(() => {
    // Cache neuf par test : le `testQueryClient` est partagé, on évite la fuite
    // d'état (titre / messages miroités) d'un test sur le suivant.
    testQueryClient.clear()
    FakeStream.instances = []
    fetchEventSourceMock.mockReset()
    refreshAccessTokenMock.mockReset()
    getAccessTokenMock.mockReset()
    sendMessageMock.mockReset()
    getAccessTokenMock.mockReturnValue('access-jwt')
    sendMessageMock.mockResolvedValue(undefined)
    fetchEventSourceMock.mockImplementation((url: string, init: FetchEventSourceInit) => {
      const stream = new FakeStream(url, init)
      return stream.promise
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('ouverture du flux', () => {
    it('ouvre le flux SSE sur le bon endpoint avec le header Bearer', () => {
      renderHook(() => useChatStream('c1'), { wrapper })

      expect(fetchEventSourceMock).toHaveBeenCalledTimes(1)
      const stream = lastStream()
      expect(stream.url).toContain('/chat/conversations/c1/stream')
      expect(stream.init.headers?.Authorization).toBe('Bearer access-jwt')
    })

    it('n’ouvre aucun flux sans conversation active', () => {
      renderHook(() => useChatStream(''), { wrapper })

      expect(fetchEventSourceMock).not.toHaveBeenCalled()
    })

    it('démarre au repos (idle), sans message ni texte de streaming', () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })

      expect(result.current.state.status).toBe('idle')
      expect(result.current.state.streamingText).toBe('')
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.isReconnecting).toBe(false)
      expect(result.current.messages).toHaveLength(0)
      expect(result.current.canSend).toBe(true)
    })
  })

  describe('machine d’état du tour', () => {
    it('passe en thinking dès l’envoi (avant le 1er token) et ajoute le message user', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'Je veux un Postgres')

      expect(stream).toBeDefined()
      expect(result.current.state.status).toBe('thinking')
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0]?.role).toBe(MessageRole.USER)
      expect(result.current.messages[0]?.content).toBe('Je veux un Postgres')
    })

    it('passe en streaming au 1er token et accumule le texte', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')

      act(() => {
        stream.emit(ChatStreamEventName.TOKEN, { delta: 'Post' })
        stream.emit(ChatStreamEventName.TOKEN, { delta: 'gres' })
      })

      await waitFor(() => expect(result.current.state.status).toBe('streaming'))
      expect(result.current.state.streamingText).toBe('Postgres')
    })

    it('passe en done et vide le buffer quand le message final est figé', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')

      act(() => {
        stream.emit(ChatStreamEventName.TOKEN, { delta: '…' })
        stream.emit(ChatStreamEventName.MESSAGE, { content: 'Voici ma proposition' })
      })

      await waitFor(() => expect(result.current.state.status).toBe('done'))
      expect(result.current.state.streamingText).toBe('')
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[1]?.role).toBe(MessageRole.ASSISTANT)
      expect(result.current.messages[1]?.content).toBe('Voici ma proposition')
    })

    it('passe en done sur une action proposée (bulle porteuse de l’action)', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')

      act(() => stream.emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal()))

      await waitFor(() => expect(result.current.messages).toHaveLength(2))
      expect(result.current.state.status).toBe('done')
      const assistant = result.current.messages[1]
      expect(assistant?.action?.intent).toBe('Déployer un Postgres')
      expect(assistant?.action?.status).toBe(ActionStatus.PROPOSED)
      expect(assistant?.action?.id).toBe('act-1')
    })

    it('ignore un envoi vide (pas de message, pas de POST)', () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })

      act(() => result.current.send('   '))

      expect(result.current.messages).toHaveLength(0)
      expect(result.current.state.status).toBe('idle')
      expect(sendMessageMock).not.toHaveBeenCalled()
    })
  })

  describe('verrou d’envoi (E2 / canSend)', () => {
    it('canSend=false pendant thinking', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      await sendAfterOpen(result.current.send, 'go')

      expect(result.current.state.status).toBe('thinking')
      expect(result.current.canSend).toBe(false)
    })

    it('canSend=false pendant streaming', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')

      act(() => stream.emit(ChatStreamEventName.TOKEN, { delta: 'x' }))

      await waitFor(() => expect(result.current.state.status).toBe('streaming'))
      expect(result.current.canSend).toBe(false)
    })

    it('canSend redevient true après done', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')

      act(() => stream.emit(ChatStreamEventName.MESSAGE, { content: 'fini' }))

      await waitFor(() => expect(result.current.canSend).toBe(true))
    })

    it('un 2e envoi est ignoré tant qu’un tour est en cours', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      await sendAfterOpen(result.current.send, 'premier')
      sendMessageMock.mockClear()

      act(() => result.current.send('deuxième'))

      expect(sendMessageMock).not.toHaveBeenCalled()
      expect(result.current.messages).toHaveLength(1)
    })
  })

  describe('course du 1er message (E1)', () => {
    it('n’émet le POST /messages qu’après l’ouverture du flux SSE', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = lastStream()

      // Le flux n'est pas encore ouvert : l'envoi ne doit PAS encore poster.
      act(() => result.current.send('Je veux un Postgres'))
      expect(sendMessageMock).not.toHaveBeenCalled()
      // Le message utilisateur est tout de même affiché (optimiste) et on réfléchit.
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.state.status).toBe('thinking')

      // À l'ouverture du flux, le message en attente est posté.
      await act(async () => {
        stream.open(200)
      })
      await waitFor(() => expect(sendMessageMock).toHaveBeenCalledWith('c1', 'Je veux un Postgres'))
    })

    it('poste immédiatement si le flux est déjà ouvert', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = lastStream()
      await act(async () => {
        stream.open(200)
      })

      act(() => result.current.send('go'))

      await waitFor(() => expect(sendMessageMock).toHaveBeenCalledWith('c1', 'go'))
    })
  })

  describe('erreurs typées', () => {
    it('error métier (event error) → kind business, sans reconnexion', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')

      act(() => stream.emit(ChatStreamEventName.ERROR, { message: 'Template inconnu' }))

      await waitFor(() => expect(result.current.state.status).toBe('error'))
      expect(result.current.state.error).toEqual({ kind: 'business', message: 'Template inconnu' })
      expect(result.current.state.isReconnecting).toBe(false)
    })

    it('401 avec refresh épuisé → kind auth', async () => {
      refreshAccessTokenMock.mockRejectedValue(new Error('refresh expiré'))
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = lastStream()

      await act(async () => {
        stream.open(401)
      })

      await waitFor(() => expect(result.current.state.status).toBe('error'))
      expect(result.current.state.error?.kind).toBe('auth')
      expect(fetchEventSourceMock).toHaveBeenCalledTimes(1)
    })

    it('sur 401, rafraîchit puis rouvre le flux avec le nouveau Bearer (pas d’erreur)', async () => {
      getAccessTokenMock.mockReturnValueOnce('access-expiré')
      getAccessTokenMock.mockReturnValue('access-frais')
      refreshAccessTokenMock.mockResolvedValue(undefined)

      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const firstStream = lastStream()
      expect(firstStream.init.headers?.Authorization).toBe('Bearer access-expiré')

      await act(async () => {
        firstStream.open(401)
      })

      await waitFor(() => expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(fetchEventSourceMock).toHaveBeenCalledTimes(2))
      expect(lastStream().init.headers?.Authorization).toBe('Bearer access-frais')
      expect(result.current.state.error).toBeNull()
    })

    it('échec du POST d’envoi → erreur (message non perdu, B3)', async () => {
      sendMessageMock.mockRejectedValueOnce(new Error('boom'))
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = lastStream()
      await act(async () => {
        stream.open(200)
      })

      act(() => result.current.send('Je veux un Postgres'))

      await waitFor(() => expect(result.current.state.status).toBe('error'))
      // Le message utilisateur reste affiché (B3 : jamais perdu).
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0]?.content).toBe('Je veux un Postgres')
    })
  })

  describe('titre auto (1er message)', () => {
    it('met à jour le libellé du fil dans le cache au reçu d’un event title', async () => {
      // Cache seedé avec le fil au titre par défaut (comme après création).
      testQueryClient.setQueryData<readonly Conversation[]>(CHAT_QUERY_KEYS.conversations, [
        {
          id: 'c1',
          title: 'Nouvelle conversation',
          createdAt: null,
          updatedAt: null,
          relativeWhen: "à l'instant",
        },
      ])
      renderHook(() => useChatStream('c1'), { wrapper })
      const stream = lastStream()
      await act(async () => {
        stream.open(200)
      })

      act(() => stream.emit('title', { title: 'Déploiement Redis' }))

      // Patch direct du cache (pas de refetch : la transaction back n'est pas
      // encore commitée au moment où l'event arrive).
      const fils = testQueryClient.getQueryData<readonly Conversation[]>(
        CHAT_QUERY_KEYS.conversations,
      )
      expect(fils?.[0]?.title).toBe('Déploiement Redis')
    })
  })

  describe('persistance des messages figés (Fix 3)', () => {
    it('miroite la proposition figée dans le cache des messages du fil', async () => {
      // Le tour figé est miroité dans le cache `conversationMessages` : au démontage
      // de la page, la carte survit (servie depuis ce cache) sans nouvel event SSE.
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')

      act(() => stream.emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal()))
      await waitFor(() => expect(result.current.messages).toHaveLength(2))

      const cached = testQueryClient.getQueryData<readonly { action?: { id: string } }[]>(
        CHAT_QUERY_KEYS.conversationMessages('c1'),
      )
      // Le message utilisateur + la bulle porteuse de l'action sont persistés.
      expect(cached).toHaveLength(2)
      expect(cached?.[1]?.action?.id).toBe('act-1')
    })

    it('ne touche pas au cache des messages tant qu’aucun message figé n’existe', () => {
      renderHook(() => useChatStream('c1'), { wrapper })

      // Aucun tour entamé : le cache reste vierge (pas d'écriture parasite).
      expect(
        testQueryClient.getQueryData(CHAT_QUERY_KEYS.conversationMessages('c1')),
      ).toBeUndefined()
    })
  })

  describe('reconnexion bornée avec backoff (B4)', () => {
    it('sur coupure réseau, passe en isReconnecting et rouvre un flux (pas d’erreur immédiate)', async () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = lastStream()
      await act(async () => {
        stream.open(200)
      })

      await act(async () => {
        stream.fail(new Error('connexion réseau perdue'))
      })
      expect(result.current.state.isReconnecting).toBe(true)
      expect(result.current.state.status).not.toBe('error')

      // Après le délai de backoff, un nouveau flux est ouvert.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })
      expect(fetchEventSourceMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    it('après épuisement des tentatives, bascule en error kind network', async () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })

      // 1 ouverture initiale + N reconnexions : chaque flux échoue, jusqu'à épuisement.
      // À l'échec du dernier flux toléré, plus de reconnexion → error{network}.
      const totalAttempts = 5
      for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
        const stream = FakeStream.instances[attempt]
        expect(stream).toBeDefined()
        await act(async () => {
          stream?.open(200)
        })
        await act(async () => {
          stream?.fail(new Error('coupure'))
        })
        // Avancer le backoff déclenche la reconnexion suivante (sauf à l'épuisement).
        await act(async () => {
          await vi.advanceTimersByTimeAsync(10000)
        })
      }

      expect(result.current.state.status).toBe('error')
      expect(result.current.state.error?.kind).toBe('network')
      expect(result.current.state.isReconnecting).toBe(false)
    })
  })

  describe('stop (A3)', () => {
    it('stop() abandonne la génération et repasse en done', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')
      act(() => stream.emit(ChatStreamEventName.TOKEN, { delta: 'partiel' }))
      await waitFor(() => expect(result.current.state.status).toBe('streaming'))

      act(() => result.current.stop())

      await waitFor(() => expect(result.current.state.status).toBe('done'))
      expect(result.current.canSend).toBe(true)
    })
  })

  describe('retry (B2)', () => {
    it('retry() réémet le dernier message utilisateur', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'Je veux un Postgres')
      act(() => stream.emit(ChatStreamEventName.ERROR, { message: 'Quota dépassé' }))
      await waitFor(() => expect(result.current.state.status).toBe('error'))
      sendMessageMock.mockClear()

      act(() => result.current.retry())

      await waitFor(() => expect(sendMessageMock).toHaveBeenCalledWith('c1', 'Je veux un Postgres'))
      expect(result.current.state.status).toBe('thinking')
      expect(result.current.state.error).toBeNull()
    })

    it('retry() sans message précédent ne fait rien', () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })

      act(() => result.current.retry())

      expect(sendMessageMock).not.toHaveBeenCalled()
    })
  })

  describe('actions (chat fonctionnel préservé)', () => {
    it('marque l’action exécutée et mémorise le déploiement sur action_result', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')
      act(() => stream.emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal()))
      await waitFor(() => expect(result.current.messages).toHaveLength(2))

      act(() =>
        stream.emit(ChatStreamEventName.ACTION_RESULT, {
          action_id: 'act-1',
          kind: 'deploy',
          success: true,
          deployment_id: 'dep-1',
        }),
      )

      await waitFor(() =>
        expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.EXECUTED),
      )
      expect(result.current.lastDeploymentId).toBe('dep-1')
      // Le déploiement créé est aussi rattaché à l'action elle-même : la carte peut
      // afficher un CTA « Voir le déploiement → » sans dépendre de l'état global.
      expect(result.current.messages[1]?.action?.deploymentId).toBe('dep-1')
    })

    it('marque la composition de stack exécutée et rattache le stack_id', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')
      act(() => stream.emit(ChatStreamEventName.ACTION_PROPOSED, stackProposal()))
      await waitFor(() => expect(result.current.messages).toHaveLength(2))

      act(() =>
        stream.emit(ChatStreamEventName.ACTION_RESULT, {
          action_id: 'act-stack',
          kind: 'compose_stack',
          success: true,
          deployment_id: null,
          stack_id: 'stack-1',
        }),
      )

      await waitFor(() =>
        expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.EXECUTED),
      )
      // La stack créée est rattachée à l'action : la carte affiche un CTA
      // « Voir la stack → » contextuel (≠ CTA déploiement).
      expect(result.current.messages[1]?.action?.stackId).toBe('stack-1')
    })

    it('marque l’action annulée localement et ne la redégrade pas sur action_result', async () => {
      const { result } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = await sendAfterOpen(result.current.send, 'go')
      act(() => stream.emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal()))
      await waitFor(() => expect(result.current.messages).toHaveLength(2))

      act(() => result.current.rejectActionLocally('act-1'))
      await waitFor(() =>
        expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.REJECTED),
      )

      act(() =>
        stream.emit(ChatStreamEventName.ACTION_RESULT, {
          action_id: 'act-1',
          kind: 'deploy',
          success: false,
        }),
      )
      await waitFor(() =>
        expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.REJECTED),
      )
    })
  })

  describe('cycle de vie', () => {
    it('abandonne le flux au démontage (cleanup via AbortController)', () => {
      const { unmount } = renderHook(() => useChatStream('c1'), { wrapper })
      const stream = lastStream()

      expect(stream.init.signal?.aborted).toBe(false)
      unmount()
      expect(stream.init.signal?.aborted).toBe(true)
    })

    it('réinitialise l’état et rouvre le flux au changement de fil', async () => {
      const { result, rerender } = renderHook(({ id }) => useChatStream(id), {
        wrapper,
        initialProps: { id: 'c1' },
      })
      const firstStream = await sendAfterOpen(result.current.send, 'go')
      expect(result.current.messages).toHaveLength(1)

      rerender({ id: 'c2' })

      expect(firstStream.init.signal?.aborted).toBe(true)
      await waitFor(() => expect(result.current.messages).toHaveLength(0))
      expect(result.current.state.status).toBe('idle')
      expect(lastStream().url).toContain('/chat/conversations/c2/stream')
    })
  })
})
