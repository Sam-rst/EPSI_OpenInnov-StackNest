import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { StackDTO } from '../../types/dto/StackDTO'
import { StacksPage } from '../StacksPage'

function stackDto(overrides: Partial<StackDTO> = {}): StackDTO {
  return {
    id: 'stack-1',
    owner_id: 'user-1',
    name: 'ma-stack',
    status: 'running',
    services: [
      {
        id: 's1',
        template_id: 'pg16',
        version: '16',
        alias: 'db',
        service_status: 'running',
        order_index: 0,
        params: {},
        published_port: null,
        container_ref: null,
      },
    ],
    created_at: null,
    updated_at: null,
    ...overrides,
  }
}

function renderPage() {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/stacks']}>
        <Routes>
          <Route path="/stacks" element={<StacksPage />} />
          <Route path="/stacks/:id" element={<div>Détail stack</div>} />
          <Route path="/stacks/new" element={<div>Builder</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('StacksPage', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('liste les stacks avec nom, statut et nb de services', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([stackDto()])))

    renderPage()

    expect(await screen.findByText('ma-stack')).toBeInTheDocument()
    expect(screen.getByText('En ligne')).toBeInTheDocument()
    expect(screen.getByText('1 service')).toBeInTheDocument()
  })

  it('navigue vers le détail au clic sur une carte', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([stackDto()])))

    renderPage()
    await screen.findByText('ma-stack')

    await userEvent.click(screen.getByText('ma-stack'))

    expect(await screen.findByText('Détail stack')).toBeInTheDocument()
  })

  it('affiche un état vide honnête sans stack', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([])))

    renderPage()

    expect(await screen.findByText('Aucune stack')).toBeInTheDocument()
  })

  it('expose une erreur avec réessai', async () => {
    server.use(http.get('*/stacks', () => new HttpResponse(null, { status: 500 })))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Impossible de charger les stacks.')).toBeInTheDocument()
    })
  })
})
