import type { EventSourceMessage, FetchEventSourceInit } from '@microsoft/fetch-event-source'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DeploymentEventDTO } from '../../types/dto/DeploymentEventDTO'
import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { DeploymentStep } from '../../types/enums/DeploymentStep'
import { useDeploymentEvents } from '../useDeploymentEvents'

/**
 * On mocke entièrement `@microsoft/fetch-event-source` : chaque ouverture de flux
 * crée une `FakeStream` qui capture l'`init` (headers, signal, callbacks) et
 * reproduit le contrat de la lib — `onopen`/`onmessage`/`onerror` peuvent lever
 * pour rejeter la promesse, l'`abort` du signal la résout. Le test pilote ainsi
 * le flux SSE (events, 401, abandon) sans réseau ni `EventSource` natif.
 */
const { fetchEventSourceMock, refreshAccessTokenMock, getAccessTokenMock } = vi.hoisted(() => ({
  fetchEventSourceMock: vi.fn(),
  refreshAccessTokenMock: vi.fn(),
  getAccessTokenMock: vi.fn(),
}))

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: fetchEventSourceMock,
  EventStreamContentType: 'text/event-stream',
}))

vi.mock('../../../core/api/tokenStore', () => ({
  getAccessToken: getAccessTokenMock,
}))

vi.mock('../../../core/api/refreshSession', () => ({
  refreshAccessToken: refreshAccessTokenMock,
}))

/**
 * Flux SSE simulé : pilotable par le test, fidèle à la mécanique de la lib
 * (une erreur dans `onopen`/`onerror` rejette la promesse `fetchEventSource`).
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

  /** Émule la réponse HTTP d'ouverture : un `onopen` qui lève rejette la promesse. */
  open(status: number): void {
    try {
      const result = this.init.onopen?.(httpResponse(status))
      void Promise.resolve(result).catch((error) => this.fail(error))
    } catch (error) {
      this.fail(error)
    }
  }

  /** Émule la réception d'une trame SSE (event nommé d'après le statut). */
  message(dto: DeploymentEventDTO): void {
    this.init.onmessage?.(sseFrame(dto))
  }

  /** Route une erreur via `onerror` comme la lib : si `onerror` lève, on rejette. */
  private fail(error: unknown): void {
    try {
      this.init.onerror?.(error)
    } catch (rethrown) {
      this.reject(rethrown)
    }
  }
}

/** Construit une réponse HTTP minimale (status + content-type) pour `onopen`. */
function httpResponse(status: number): Response {
  const contentType = status === 200 ? 'text/event-stream' : 'application/json'
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name === 'content-type' ? contentType : null) },
  } as unknown as Response
}

/** Construit une trame `EventSourceMessage` (event nommé d'après le statut). */
function sseFrame(dto: DeploymentEventDTO): EventSourceMessage {
  return { id: '', event: dto.status, data: JSON.stringify(dto), retry: undefined }
}

function dtoFrame(overrides: Partial<DeploymentEventDTO> & { status: string }): DeploymentEventDTO {
  return { message: null, access_url: null, secret: null, ...overrides }
}

/** Renvoie le dernier flux SSE ouvert, ou échoue le test. */
function lastStream(): FakeStream {
  const stream = FakeStream.instances.at(-1)
  if (stream === undefined) {
    throw new Error('Aucun flux fetchEventSource ouvert.')
  }
  return stream
}

describe('useDeploymentEvents (fetchEventSource authentifié)', () => {
  beforeEach(() => {
    FakeStream.instances = []
    fetchEventSourceMock.mockReset()
    refreshAccessTokenMock.mockReset()
    getAccessTokenMock.mockReset()
    getAccessTokenMock.mockReturnValue('access-jwt')

    fetchEventSourceMock.mockImplementation((url: string, init: FetchEventSourceInit) => {
      const stream = new FakeStream(url, init)
      return stream.promise
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ouvre le flux SSE sur le bon endpoint avec le header Bearer', () => {
    renderHook(() => useDeploymentEvents('dep-1'))

    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1)
    const stream = lastStream()
    expect(stream.url).toContain('/deployments/dep-1/events')
    expect(stream.init.headers?.Authorization).toBe('Bearer access-jwt')
  })

  it('démarre vide puis accumule les logs reçus', async () => {
    const { result } = renderHook(() => useDeploymentEvents('dep-1'))
    const stream = lastStream()

    expect(result.current.logs).toHaveLength(0)
    expect(result.current.isDone).toBe(false)

    act(() => {
      stream.message(dtoFrame({ status: 'provisioning', message: 'Pull de l’image…' }))
    })

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1)
    })
    expect(result.current.logs[0]?.message).toBe('Pull de l’image…')
    expect(result.current.status).toBe(DeploymentStatus.PROVISIONING)
    expect(result.current.currentStep).toBe(DeploymentStep.PULL_IMAGE)
  })

  it('au passage running, révèle l’accès (url + secret) sans fermer le flux (#16)', async () => {
    const { result } = renderHook(() => useDeploymentEvents('dep-1'))
    const stream = lastStream()

    act(() => {
      stream.message(
        dtoFrame({
          status: 'running',
          message: 'Ressource prête',
          access_url: '10.0.0.5:32769',
          secret: 'mdp-usage-unique',
        }),
      )
    })

    await waitFor(() => {
      expect(result.current.status).toBe(DeploymentStatus.RUNNING)
    })
    expect(result.current.currentStep).toBe(DeploymentStep.READY)
    expect(result.current.access).toEqual({
      url: '10.0.0.5:32769',
      password: 'mdp-usage-unique',
    })
    // `running` n'est PAS terminal : on garde l'écoute pour les transitions de
    // cycle de vie (stop/start/destroy) qui doivent arriver en live (#16).
    expect(result.current.isDone).toBe(false)
    expect(stream.init.signal?.aborted).toBe(false)
  })

  it('garde le flux ouvert sur stopped, puis suit la transition de redémarrage (#16)', async () => {
    const { result } = renderHook(() => useDeploymentEvents('dep-1'))
    const stream = lastStream()

    act(() => {
      stream.message(dtoFrame({ status: 'running', access_url: '10.0.0.5:32769', secret: 'x' }))
      stream.message(dtoFrame({ status: 'stopped', message: 'Conteneur arrêté' }))
    })

    await waitFor(() => {
      expect(result.current.status).toBe(DeploymentStatus.STOPPED)
    })
    // `stopped` n'est pas terminal : un restart doit encore être reçu en live.
    expect(result.current.isDone).toBe(false)
    expect(stream.init.signal?.aborted).toBe(false)

    act(() => {
      stream.message(dtoFrame({ status: 'running', message: 'Redémarré' }))
    })

    await waitFor(() => {
      expect(result.current.status).toBe(DeploymentStatus.RUNNING)
    })
    expect(result.current.isDone).toBe(false)
  })

  it('ferme le flux quand le déploiement est détruit (terminal #16)', async () => {
    const { result } = renderHook(() => useDeploymentEvents('dep-1'))
    const stream = lastStream()

    act(() => {
      stream.message(dtoFrame({ status: 'destroyed', message: 'Ressource supprimée' }))
    })

    await waitFor(() => {
      expect(result.current.isDone).toBe(true)
    })
    expect(result.current.status).toBe(DeploymentStatus.DESTROYED)
    expect(stream.init.signal?.aborted).toBe(true)
  })

  it('ferme le flux en cas d’échec (terminal #16)', async () => {
    const { result } = renderHook(() => useDeploymentEvents('dep-1'))
    const stream = lastStream()

    act(() => {
      stream.message(dtoFrame({ status: 'failed', message: 'Échec du provisioning' }))
    })

    await waitFor(() => {
      expect(result.current.isDone).toBe(true)
    })
    expect(result.current.status).toBe(DeploymentStatus.FAILED)
    expect(stream.init.signal?.aborted).toBe(true)
  })

  it('n’ouvre aucun flux sans identifiant', () => {
    const { result } = renderHook(() => useDeploymentEvents(undefined))

    expect(fetchEventSourceMock).not.toHaveBeenCalled()
    expect(result.current.logs).toHaveLength(0)
    expect(result.current.isDone).toBe(false)
  })

  it('abandonne le flux au démontage (cleanup via AbortController)', () => {
    const { unmount } = renderHook(() => useDeploymentEvents('dep-1'))
    const stream = lastStream()

    expect(stream.init.signal?.aborted).toBe(false)

    unmount()

    expect(stream.init.signal?.aborted).toBe(true)
  })

  it('sur 401, rafraîchit l’access token puis rouvre le flux avec le nouveau Bearer', async () => {
    getAccessTokenMock.mockReturnValueOnce('access-expiré')
    getAccessTokenMock.mockReturnValue('access-frais')
    refreshAccessTokenMock.mockResolvedValue(undefined)

    renderHook(() => useDeploymentEvents('dep-1'))
    const firstStream = lastStream()
    expect(firstStream.init.headers?.Authorization).toBe('Bearer access-expiré')

    // Le back renvoie 401 (token expiré) : le flux doit déclencher le refresh.
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

    const { result } = renderHook(() => useDeploymentEvents('dep-1'))
    const stream = lastStream()

    await act(async () => {
      stream.open(401)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    // Pas de reconnexion : un seul flux ouvert au total.
    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1)
  })
})
