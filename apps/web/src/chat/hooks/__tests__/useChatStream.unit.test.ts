import type { EventSourceMessage, FetchEventSourceInit } from '@microsoft/fetch-event-source'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ActionStatus } from '../../types/enums/ActionStatus'
import { MessageRole } from '../../types/enums/MessageRole'
import { ChatStreamEventName } from '../../types/models/ChatStreamEvent'
import { useChatStream } from '../useChatStream'

/**
 * On mocke `@microsoft/fetch-event-source` (flux SSE), le `tokenStore` (Bearer), le
 * `refreshSession` (refresh sur 401) et le service REST (`sendMessage`). Chaque
 * ouverture crée une `FakeStream` pilotable : on émet `token`/`message`/
 * `action_proposed`/`action_result`/`error`, on simule un 401, on abandonne — sans
 * réseau ni `EventSource` natif. Même mécanique que `useDeploymentEvents`.
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

/** Flux SSE simulé : un `onopen`/`onerror` qui lève rejette la promesse. */
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

  private fail(error: unknown): void {
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

describe('useChatStream (fetchEventSource authentifié sur /chat)', () => {
  beforeEach(() => {
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
  })

  it('ouvre le flux SSE sur le bon endpoint avec le header Bearer', () => {
    renderHook(() => useChatStream('c1'))

    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1)
    const stream = lastStream()
    expect(stream.url).toContain('/chat/conversations/c1/stream')
    expect(stream.init.headers?.Authorization).toBe('Bearer access-jwt')
  })

  it('n’ouvre aucun flux sans conversation active', () => {
    renderHook(() => useChatStream(''))

    expect(fetchEventSourceMock).not.toHaveBeenCalled()
  })

  it('démarre au repos, sans message ni streaming', () => {
    const { result } = renderHook(() => useChatStream('c1'))

    expect(result.current.messages).toHaveLength(0)
    expect(result.current.streamingText).toBe('')
    expect(result.current.isStreaming).toBe(false)
  })

  it('ajoute le message utilisateur et envoie le POST à l’envoi', async () => {
    const { result } = renderHook(() => useChatStream('c1'))

    act(() => {
      result.current.send('Je veux un Postgres')
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0]?.role).toBe(MessageRole.USER)
    expect(result.current.messages[0]?.content).toBe('Je veux un Postgres')
    expect(result.current.isStreaming).toBe(true)
    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledWith('c1', 'Je veux un Postgres')
    })
  })

  it('ignore un envoi vide (pas de POST)', () => {
    const { result } = renderHook(() => useChatStream('c1'))

    act(() => {
      result.current.send('   ')
    })

    expect(result.current.messages).toHaveLength(0)
    expect(sendMessageMock).not.toHaveBeenCalled()
  })

  it('accumule les tokens reçus dans streamingText', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.emit(ChatStreamEventName.TOKEN, { delta: 'Post' })
      stream.emit(ChatStreamEventName.TOKEN, { delta: 'gres' })
    })

    await waitFor(() => {
      expect(result.current.streamingText).toBe('Postgres')
    })
  })

  it('fige le message final assistant et vide le buffer', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.emit(ChatStreamEventName.TOKEN, { delta: '…' })
      stream.emit(ChatStreamEventName.MESSAGE, { content: 'Voici ma proposition' })
    })

    await waitFor(() => {
      expect(result.current.streamingText).toBe('')
    })
    expect(result.current.messages).toHaveLength(2)
    const assistant = result.current.messages[1]
    expect(assistant?.role).toBe(MessageRole.ASSISTANT)
    expect(assistant?.content).toBe('Voici ma proposition')
    expect(result.current.isStreaming).toBe(false)
  })

  it('crée une bulle assistant portant l’action sur action_proposed (sans message préalable)', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal())
    })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })
    const assistant = result.current.messages[1]
    expect(assistant?.role).toBe(MessageRole.ASSISTANT)
    // La bulle porte une amorce neutre ; la reformulation détaillée vit dans la carte.
    expect(assistant?.content).toBeTruthy()
    expect(assistant?.action?.intent).toBe('Déployer un Postgres')
    expect(assistant?.action?.status).toBe(ActionStatus.PROPOSED)
    expect(assistant?.action?.id).toBe('act-1')
    expect(result.current.isStreaming).toBe(false)
  })

  it('marque l’action exécutée et mémorise le déploiement sur action_result', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal())
    })
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    act(() => {
      stream.emit(ChatStreamEventName.ACTION_RESULT, {
        action_id: 'act-1',
        kind: 'deploy',
        success: true,
        deployment_id: 'dep-1',
      })
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.EXECUTED)
    })
    expect(result.current.lastDeploymentId).toBe('dep-1')
  })

  it('marque l’action « annulée » localement et ne la redégrade pas sur action_result', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal())
    })
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    // Décision utilisateur : annulation locale immédiate.
    act(() => {
      result.current.rejectActionLocally('act-1')
    })
    await waitFor(() => {
      expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.REJECTED)
    })

    // Le back republie un action_result (échec indistinct) : il ne doit PAS écraser.
    act(() => {
      stream.emit(ChatStreamEventName.ACTION_RESULT, {
        action_id: 'act-1',
        kind: 'deploy',
        success: false,
      })
    })
    await waitFor(() => {
      expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.REJECTED)
    })
  })

  it('marque l’action en échec sur action_result raté (confirmation échouée)', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.emit(ChatStreamEventName.ACTION_PROPOSED, deployProposal())
      stream.emit(ChatStreamEventName.ACTION_RESULT, {
        action_id: 'act-1',
        kind: 'deploy',
        success: false,
      })
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.FAILED)
    })
  })

  it('expose une erreur honnête sur une trame error', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.emit(ChatStreamEventName.ERROR, { message: 'Quota dépassé' })
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Quota dépassé')
    })
    expect(result.current.isStreaming).toBe(false)
  })

  it('abandonne le flux au démontage (cleanup via AbortController)', () => {
    const { unmount } = renderHook(() => useChatStream('c1'))
    const stream = lastStream()

    expect(stream.init.signal?.aborted).toBe(false)
    unmount()
    expect(stream.init.signal?.aborted).toBe(true)
  })

  it('réinitialise l’état et rouvre le flux au changement de fil', async () => {
    const { result, rerender } = renderHook(({ id }) => useChatStream(id), {
      initialProps: { id: 'c1' },
    })
    act(() => result.current.send('go'))
    const firstStream = lastStream()
    expect(result.current.messages).toHaveLength(1)

    rerender({ id: 'c2' })

    expect(firstStream.init.signal?.aborted).toBe(true)
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(0)
    })
    expect(lastStream().url).toContain('/chat/conversations/c2/stream')
  })

  it('sur 401, rafraîchit l’access token puis rouvre le flux avec le nouveau Bearer', async () => {
    getAccessTokenMock.mockReturnValueOnce('access-expiré')
    getAccessTokenMock.mockReturnValue('access-frais')
    refreshAccessTokenMock.mockResolvedValue(undefined)

    renderHook(() => useChatStream('c1'))
    const firstStream = lastStream()
    expect(firstStream.init.headers?.Authorization).toBe('Bearer access-expiré')

    await act(async () => {
      firstStream.open(401)
    })

    await waitFor(() => {
      expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(fetchEventSourceMock).toHaveBeenCalledTimes(2)
    })
    expect(lastStream().init.headers?.Authorization).toBe('Bearer access-frais')
  })

  it('si le refresh échoue, passe en erreur sans boucle de reconnexion', async () => {
    refreshAccessTokenMock.mockRejectedValue(new Error('refresh expiré'))

    const { result } = renderHook(() => useChatStream('c1'))
    const stream = lastStream()

    await act(async () => {
      stream.open(401)
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1)
  })
})
