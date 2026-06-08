import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { DeploymentDTO } from '../../types/dto/DeploymentDTO'
import { DeploymentsPage } from '../DeploymentsPage'

function deploymentDto(overrides: Partial<DeploymentDTO> = {}): DeploymentDTO {
  return {
    id: 'dep-1',
    template_id: 'pg16',
    template_version: '16',
    name: 'postgres-prod',
    status: 'running',
    params: {},
    host: '10.0.0.5',
    published_port: 32769,
    access_url: '10.0.0.5:32769',
    created_at: '2026-06-07T09:12:00Z',
    updated_at: '2026-06-07T09:13:10Z',
    ...overrides,
  }
}

function renderList() {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/deployments']}>
        <DeploymentsPage />
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('DeploymentsPage (liste)', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('affiche la table des déploiements renvoyés par l’API', async () => {
    server.use(
      http.get('*/deployments', () =>
        HttpResponse.json([
          deploymentDto(),
          deploymentDto({ id: 'dep-2', name: 'redis-cache', status: 'stopped' }),
        ]),
      ),
    )

    renderList()

    expect(await screen.findByText('postgres-prod')).toBeInTheDocument()
    expect(screen.getByText('redis-cache')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nouveau déploiement/ })).toBeInTheDocument()
  })

  it('affiche un état vide honnête quand il n’y a aucun déploiement', async () => {
    server.use(http.get('*/deployments', () => HttpResponse.json([])))

    renderList()

    expect(await screen.findByText('Aucun déploiement')).toBeInTheDocument()
    expect(
      screen.getByText(/Provisionne ta première ressource depuis le catalogue/),
    ).toBeInTheDocument()
  })

  it('affiche un état d’erreur avec réessai', async () => {
    server.use(http.get('*/deployments', () => new HttpResponse(null, { status: 500 })))

    renderList()

    expect(await screen.findByText('Impossible de charger les déploiements')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Réessayer/ })).toBeInTheDocument()
  })
})
