import { act, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { DeploymentDTO } from '../../types/dto/DeploymentDTO'
import type { DeploymentEventDTO } from '../../types/dto/DeploymentEventDTO'
import { DeploymentDetailPage } from '../DeploymentDetailPage'

/** Faux `EventSource` contrôlable : la dernière instance est pilotée par le test. */
class FakeEventSource {
  static last: FakeEventSource | undefined

  url: string
  closed = false
  private listeners = new Map<string, Set<EventListener>>()

  constructor(url: string) {
    this.url = url
    FakeEventSource.last = this
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

function deploymentDto(overrides: Partial<DeploymentDTO> = {}): DeploymentDTO {
  return {
    id: 'dep-1',
    template_id: 'pg16',
    template_version: '16',
    name: 'postgres-prod',
    status: 'provisioning',
    params: { db_name: 'app' },
    host: null,
    published_port: null,
    access_url: null,
    created_at: '2026-06-07T09:12:00Z',
    updated_at: '2026-06-07T09:12:05Z',
    ...overrides,
  }
}

function renderDetail(id: string) {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[`/deployments/${id}`]}>
        <Routes>
          <Route path="/deployments/:id" element={<DeploymentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('DeploymentDetailPage (suivi SSE)', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', FakeEventSource as unknown as typeof EventSource)
    FakeEventSource.last = undefined
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    server.resetHandlers()
  })

  it('affiche le header, le stepper et la console de logs', async () => {
    server.use(http.get('*/deployments/dep-1', () => HttpResponse.json(deploymentDto())))

    renderDetail('dep-1')

    expect(await screen.findByRole('heading', { name: 'postgres-prod' })).toBeInTheDocument()
    expect(screen.getByText('Validation')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })

  it('progresse jusqu’à running, révèle l’accès et propose les actions', async () => {
    server.use(http.get('*/deployments/dep-1', () => HttpResponse.json(deploymentDto())))

    renderDetail('dep-1')
    await screen.findByRole('heading', { name: 'postgres-prod' })

    act(() => {
      FakeEventSource.last?.emit(frame({ status: 'provisioning', message: 'Pull…' }))
      FakeEventSource.last?.emit(
        frame({
          status: 'running',
          message: 'Ressource prête',
          access_url: '10.0.0.5:32769',
          secret: 'mdp-usage-unique',
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText('En ligne')).toBeInTheDocument()
    })
    // Carte d'accès (révélée au running) : mot de passe masqué + copie connexion.
    expect(screen.getByText('mot de passe')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Copier la chaîne de connexion/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Arrêter/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Détruire/ })).toBeInTheDocument()
  })

  it('affiche un état honnête quand le déploiement est introuvable (404)', async () => {
    server.use(http.get('*/deployments/inconnu', () => new HttpResponse(null, { status: 404 })))

    renderDetail('inconnu')

    expect(await screen.findByText('Déploiement introuvable')).toBeInTheDocument()
  })
})
