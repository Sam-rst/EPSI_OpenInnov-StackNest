import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { StackDTO } from '../../types/dto/StackDTO'
import { StackServiceDetailPage } from '../StackServiceDetailPage'

const { fetchEventSourceMock } = vi.hoisted(() => ({ fetchEventSourceMock: vi.fn() }))

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: fetchEventSourceMock,
  EventStreamContentType: 'text/event-stream',
}))

function stackDto(overrides: Partial<StackDTO> = {}): StackDTO {
  return {
    id: 'stack-1',
    owner_id: 'user-1',
    name: 'ma-stack',
    status: 'running',
    services: [
      {
        id: 's-db',
        template_id: 'pg16',
        version: '16',
        alias: 'db',
        service_status: 'running',
        order_index: 0,
        params: { db_name: 'app' },
        published_port: 32769,
        container_ref: 'stack-1-db-1',
      },
      {
        id: 's-api',
        template_id: 'node20',
        version: '20',
        alias: 'api',
        service_status: 'running',
        order_index: 1,
        params: {},
        published_port: null,
        container_ref: null,
      },
    ],
    links: [
      {
        id: 'l1',
        from_service_id: 's-api',
        to_service_id: 's-db',
        var_mappings: { DB_HOST: '{to.alias}' },
      },
    ],
    created_at: null,
    updated_at: null,
    ...overrides,
  }
}

function renderServiceDetail(alias = 'db') {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[`/stacks/stack-1/services/${alias}`]}>
        <Routes>
          <Route path="/stacks/:id/services/:alias" element={<StackServiceDetailPage />} />
          <Route path="/stacks/:id" element={<div>Détail stack</div>} />
          <Route path="/stacks" element={<div>Liste stacks</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('StackServiceDetailPage', () => {
  beforeEach(() => {
    fetchEventSourceMock.mockReset()
    fetchEventSourceMock.mockImplementation(() => new Promise<void>(() => undefined))
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('affiche les infos du service (image, version, port, conteneur, statut)', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto())))

    renderServiceDetail('db')

    expect(await screen.findByRole('heading', { name: 'db' })).toBeInTheDocument()
    expect(screen.getByText('pg16')).toBeInTheDocument()
    // La version est rendue exactement (pas de sous-chaîne « 16 » d'un port).
    expect(screen.getByText('16', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(/localhost:32769/)).toBeInTheDocument()
    expect(screen.getByText('stack-1-db-1')).toBeInTheDocument()
    expect(screen.getByText('En ligne')).toBeInTheDocument()
  })

  it('affiche les liens entrants et sortants du service', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto())))

    // db est fournisseur de api : un lien entrant depuis api.
    renderServiceDetail('db')
    await screen.findByRole('heading', { name: 'db' })

    expect(screen.getByText(/api/)).toBeInTheDocument()
    expect(screen.getByText('DB_HOST')).toBeInTheDocument()
  })

  it('affiche les params non-secret du service', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto())))

    renderServiceDetail('db')
    await screen.findByRole('heading', { name: 'db' })

    expect(screen.getByText('db_name')).toBeInTheDocument()
    expect(screen.getByText('app')).toBeInTheDocument()
  })

  it('expose uniquement l’action stack-level (destruction de la stack), pas d’action par service', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto())))

    renderServiceDetail('db')
    await screen.findByRole('heading', { name: 'db' })

    // Action stack-level disponible.
    expect(screen.getByRole('button', { name: /Détruire la stack/ })).toBeInTheDocument()
    // Pas d'action de cycle de vie par service (non supportée en v1 back).
    expect(screen.queryByRole('button', { name: /Redémarrer/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Arrêter le service/ })).toBeNull()
  })

  it('affiche un état d’erreur pour un service inconnu', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto())))

    renderServiceDetail('inconnu')

    expect(await screen.findByText('Service introuvable')).toBeInTheDocument()
  })
})
