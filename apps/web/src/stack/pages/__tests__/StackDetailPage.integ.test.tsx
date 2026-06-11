import type { EventSourceMessage, FetchEventSourceInit } from '@microsoft/fetch-event-source'
import { act, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { StackDTO } from '../../types/dto/StackDTO'
import type { StackEventDTO } from '../../types/dto/StackEventDTO'
import { StackDetailPage } from '../StackDetailPage'

const { fetchEventSourceMock } = vi.hoisted(() => ({ fetchEventSourceMock: vi.fn() }))

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: fetchEventSourceMock,
  EventStreamContentType: 'text/event-stream',
}))

let lastInit: FetchEventSourceInit | undefined

function emit(dto: StackEventDTO): void {
  const message: EventSourceMessage = {
    id: '',
    event: dto.status,
    data: JSON.stringify(dto),
    retry: undefined,
  }
  lastInit?.onmessage?.(message)
}

function stackDto(overrides: Partial<StackDTO> = {}): StackDTO {
  return {
    id: 'stack-1',
    owner_id: 'user-1',
    name: 'ma-stack',
    status: 'provisioning',
    services: [
      {
        id: 's-db',
        template_id: 'pg16',
        version: '16',
        alias: 'db',
        service_status: 'pending',
        order_index: 0,
        // Le param `secret` arrive déjà masqué de l'API : on vérifie qu'il n'est
        // jamais rendu en clair (et que le masque non plus, on n'affiche pas les params).
        params: { db_name: 'app', admin_password: '••••••••' },
        published_port: 32769,
        container_ref: null,
      },
      {
        id: 's-api',
        template_id: 'node20',
        version: '20',
        alias: 'api',
        service_status: 'pending',
        order_index: 1,
        params: {},
        published_port: null,
        container_ref: null,
      },
    ],
    links: [],
    created_at: null,
    updated_at: null,
    ...overrides,
  }
}

function renderDetail() {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/stacks/stack-1']}>
        <Routes>
          <Route path="/stacks/:id" element={<StackDetailPage />} />
          <Route path="/stacks" element={<div>Liste stacks</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('StackDetailPage', () => {
  beforeEach(() => {
    fetchEventSourceMock.mockReset()
    lastInit = undefined
    fetchEventSourceMock.mockImplementation((_url: string, init: FetchEventSourceInit) => {
      lastInit = init
      return new Promise<void>(() => undefined)
    })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('affiche le statut global ET le statut de chaque service (2 niveaux)', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto())))

    renderDetail()

    expect(await screen.findByText('ma-stack')).toBeInTheDocument()
    // Statut global (REST) + alias de chaque service.
    expect(screen.getByText('Provisionnement')).toBeInTheDocument()
    expect(screen.getByText('db')).toBeInTheDocument()
    expect(screen.getByText('api')).toBeInTheDocument()
    // Accès du service db (host:port publié).
    expect(screen.getByText(/localhost:32769/)).toBeInTheDocument()
  })

  it('n’affiche jamais le secret généré ni la valeur d’un param secret', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto())))

    renderDetail()
    await screen.findByText('ma-stack')

    // Aucune valeur de param (masquée ou non) n'est rendue dans le détail.
    expect(screen.queryByText('s3cr3t')).toBeNull()
    expect(screen.queryByText('••••••••')).toBeNull()
  })

  it('reflète le statut live SSE quand une trame arrive', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto())))

    renderDetail()
    await screen.findByText('ma-stack')

    act(() => emit({ status: 'running', alias: 'db', service_status: 'running' }))

    await waitFor(() => {
      // Statut global passé à « En ligne » + service db « En ligne ».
      expect(screen.getAllByText('En ligne').length).toBeGreaterThanOrEqual(2)
    })
  })

  it('dégrade proprement sur le statut REST tant qu’aucune trame SSE n’arrive (endpoint absent)', async () => {
    server.use(
      http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto({ status: 'running' }))),
    )

    renderDetail()

    // Aucune trame émise (lot 3 SSE non livré) : la page reste sur le statut REST.
    expect(await screen.findByText('ma-stack')).toBeInTheDocument()
    expect(screen.getByText('En ligne')).toBeInTheDocument()
  })

  it('affiche un état d’erreur pour une stack introuvable', async () => {
    server.use(http.get('*/stacks/inconnu', () => new HttpResponse(null, { status: 404 })))
    const Wrapper = createQueryWrapper()
    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/stacks/inconnu']}>
          <Routes>
            <Route path="/stacks/:id" element={<StackDetailPage />} />
          </Routes>
        </MemoryRouter>
      </Wrapper>,
    )

    expect(await screen.findByText('Stack introuvable')).toBeInTheDocument()
  })
})
