import type { EventSourceMessage, FetchEventSourceInit } from '@microsoft/fetch-event-source'
import { act, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { DeploymentDTO } from '../../types/dto/DeploymentDTO'
import type { DeploymentEventDTO } from '../../types/dto/DeploymentEventDTO'
import { DeploymentDetailPage } from '../DeploymentDetailPage'

/**
 * On mocke `@microsoft/fetch-event-source` : le flux SSE de la page est piloté par
 * le test. La dernière instance capture l'`init` (callbacks) pour émettre des
 * trames sans réseau ni `EventSource` natif.
 */
const { fetchEventSourceMock } = vi.hoisted(() => ({ fetchEventSourceMock: vi.fn() }))

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: fetchEventSourceMock,
  EventStreamContentType: 'text/event-stream',
}))

let lastInit: FetchEventSourceInit | undefined

function emit(dto: DeploymentEventDTO): void {
  const frame: EventSourceMessage = {
    id: '',
    event: dto.status,
    data: JSON.stringify(dto),
    retry: undefined,
  }
  lastInit?.onmessage?.(frame)
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
    lastInit = undefined
    fetchEventSourceMock.mockReset()
    fetchEventSourceMock.mockImplementation((_url: string, init: FetchEventSourceInit) => {
      lastInit = init
      return new Promise<void>((resolve) => {
        init.signal?.addEventListener('abort', () => resolve())
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
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
      emit(frame({ status: 'provisioning', message: 'Pull…' }))
      emit(
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

  it('ne fuite pas les clés internes (container_ref) dans les paramètres (#14)', async () => {
    server.use(
      http.get('*/deployments/dep-1', () =>
        HttpResponse.json(
          deploymentDto({ status: 'running', params: { db_name: 'app', container_ref: 'a1b2c3' } }),
        ),
      ),
    )

    renderDetail('dep-1')
    await screen.findByRole('heading', { name: 'postgres-prod' })

    expect(screen.getByText('db_name')).toBeInTheDocument()
    expect(screen.queryByText('container_ref')).not.toBeInTheDocument()
    expect(screen.queryByText('a1b2c3')).not.toBeInTheDocument()
  })

  it('masque la valeur d’un paramètre secret dans les détails (#17)', async () => {
    server.use(
      http.get('*/deployments/dep-1', () =>
        HttpResponse.json(
          deploymentDto({ status: 'running', params: { db_password: 'super-secret' } }),
        ),
      ),
    )

    renderDetail('dep-1')
    await screen.findByRole('heading', { name: 'postgres-prod' })

    expect(screen.getByText('db_password')).toBeInTheDocument()
    expect(screen.queryByText('super-secret')).not.toBeInTheDocument()
  })

  it('affiche le nom lisible du template quand l’API le fournit (#13)', async () => {
    server.use(
      http.get('*/deployments/dep-1', () =>
        HttpResponse.json(deploymentDto({ template_name: 'PostgreSQL' })),
      ),
    )

    renderDetail('dep-1')
    await screen.findByRole('heading', { name: 'postgres-prod' })

    expect(screen.getByText(/PostgreSQL · 16/)).toBeInTheDocument()
  })

  it('n’affiche pas le stepper de provisioning quand le déploiement est arrêté (#15)', async () => {
    server.use(http.get('*/deployments/dep-1', () => HttpResponse.json(deploymentDto())))

    renderDetail('dep-1')
    await screen.findByRole('heading', { name: 'postgres-prod' })

    // Transition de cycle de vie reçue en live : arrêté → pas de stepper trompeur.
    act(() => {
      emit(frame({ status: 'running', access_url: '10.0.0.5:32769', secret: 'x' }))
      emit(frame({ status: 'stopped', message: 'Conteneur arrêté' }))
    })

    await waitFor(() => {
      expect(screen.getByText('Arrêté')).toBeInTheDocument()
    })
    expect(screen.queryByText('Validation')).not.toBeInTheDocument()
    expect(screen.queryByText('Pull image')).not.toBeInTheDocument()
  })

  it('affiche un état honnête quand le déploiement est introuvable (404)', async () => {
    server.use(http.get('*/deployments/inconnu', () => new HttpResponse(null, { status: 404 })))

    renderDetail('inconnu')

    expect(await screen.findByText('Déploiement introuvable')).toBeInTheDocument()
  })
})
