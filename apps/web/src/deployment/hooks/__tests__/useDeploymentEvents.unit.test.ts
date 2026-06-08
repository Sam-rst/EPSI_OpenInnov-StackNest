import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DeploymentEventDTO } from '../../types/dto/DeploymentEventDTO'
import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { DeploymentStep } from '../../types/enums/DeploymentStep'
import { useDeploymentEvents } from '../useDeploymentEvents'

/**
 * Faux `EventSource` contrôlable : enregistre les écouteurs par nom d'event et
 * permet au test d'émettre des trames SSE (nommées d'après le statut, comme le
 * back). Expose `closed` pour vérifier le cleanup.
 */
class FakeEventSource {
  static instances: FakeEventSource[] = []

  url: string
  withCredentials: boolean
  closed = false
  private listeners = new Map<string, Set<EventListener>>()

  constructor(url: string, init?: { withCredentials?: boolean }) {
    this.url = url
    this.withCredentials = init?.withCredentials ?? false
    FakeEventSource.instances.push(this)
  }

  addEventListener(name: string, listener: EventListener): void {
    const set = this.listeners.get(name) ?? new Set<EventListener>()
    set.add(listener)
    this.listeners.set(name, set)
  }

  removeEventListener(name: string, listener: EventListener): void {
    this.listeners.get(name)?.delete(listener)
  }

  close(): void {
    this.closed = true
  }

  /** Émet une trame SSE (event nommé d'après le statut, payload JSON). */
  emit(dto: DeploymentEventDTO): void {
    const event = new MessageEvent(dto.status, { data: JSON.stringify(dto) })
    for (const listener of this.listeners.get(dto.status) ?? []) {
      listener(event)
    }
  }
}

function frame(overrides: Partial<DeploymentEventDTO> & { status: string }): DeploymentEventDTO {
  return { message: null, access_url: null, secret: null, ...overrides }
}

/** Renvoie la dernière instance d'`EventSource` simulée, ou échoue le test. */
function lastSource(): FakeEventSource {
  const source = FakeEventSource.instances.at(-1)
  if (source === undefined) {
    throw new Error('Aucune connexion EventSource ouverte.')
  }
  return source
}

describe('useDeploymentEvents (EventSource réel)', () => {
  beforeEach(() => {
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource as unknown as typeof EventSource)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ouvre une connexion SSE avec credentials sur le bon endpoint', () => {
    renderHook(() => useDeploymentEvents('dep-1'))

    expect(FakeEventSource.instances).toHaveLength(1)
    const source = FakeEventSource.instances[0]
    expect(source?.url).toContain('/deployments/dep-1/events')
    expect(source?.withCredentials).toBe(true)
  })

  it('démarre vide puis accumule les logs reçus', () => {
    const { result } = renderHook(() => useDeploymentEvents('dep-1'))
    const source = lastSource()

    expect(result.current.logs).toHaveLength(0)
    expect(result.current.isDone).toBe(false)

    act(() => {
      source.emit(frame({ status: 'provisioning', message: 'Pull de l’image…' }))
    })

    expect(result.current.logs).toHaveLength(1)
    expect(result.current.logs[0]?.message).toBe('Pull de l’image…')
    expect(result.current.status).toBe(DeploymentStatus.PROVISIONING)
    expect(result.current.currentStep).toBe(DeploymentStep.PULL_IMAGE)
  })

  it('au passage running, révèle l’accès (url + secret), termine et ferme la connexion', () => {
    const { result } = renderHook(() => useDeploymentEvents('dep-1'))
    const source = lastSource()

    act(() => {
      source.emit(
        frame({
          status: 'running',
          message: 'Ressource prête',
          access_url: '10.0.0.5:32769',
          secret: 'mdp-usage-unique',
        }),
      )
    })

    expect(result.current.status).toBe(DeploymentStatus.RUNNING)
    expect(result.current.currentStep).toBe(DeploymentStep.READY)
    expect(result.current.access).toEqual({
      url: '10.0.0.5:32769',
      password: 'mdp-usage-unique',
    })
    expect(result.current.isDone).toBe(true)
    expect(source.closed).toBe(true)
  })

  it('n’ouvre aucune connexion sans identifiant', () => {
    const { result } = renderHook(() => useDeploymentEvents(undefined))

    expect(FakeEventSource.instances).toHaveLength(0)
    expect(result.current.logs).toHaveLength(0)
    expect(result.current.isDone).toBe(false)
  })

  it('ferme la connexion au démontage (cleanup)', () => {
    const { unmount } = renderHook(() => useDeploymentEvents('dep-1'))
    const source = lastSource()

    unmount()

    expect(source.closed).toBe(true)
  })
})
