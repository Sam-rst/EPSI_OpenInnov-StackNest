import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

    // Chaque déploiement est rendu deux fois (table large + carte mobile responsive).
    expect(await screen.findAllByText('postgres-prod')).toHaveLength(2)
    expect(screen.getAllByText('redis-cache')).toHaveLength(2)
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

  it('révèle la barre d’actions groupées après sélection d’une ligne', async () => {
    server.use(http.get('*/deployments', () => HttpResponse.json([deploymentDto()])))
    const user = userEvent.setup()

    renderList()
    await screen.findAllByText('postgres-prod')

    expect(screen.queryByRole('region', { name: /Actions groupées/ })).not.toBeInTheDocument()

    const table = screen.getByRole('table')
    await user.click(within(table).getByRole('checkbox', { name: /Sélectionner postgres-prod/ }))

    expect(screen.getByRole('region', { name: /Actions groupées/ })).toBeInTheDocument()
    expect(screen.getByText(/1 sélectionné/)).toBeInTheDocument()
  })

  it('sélectionne tout et arrête en masse via fan-out (un appel stop par déploiement)', async () => {
    const stopped: string[] = []
    server.use(
      http.get('*/deployments', () =>
        HttpResponse.json([deploymentDto(), deploymentDto({ id: 'dep-2', name: 'redis-cache' })]),
      ),
      http.post('*/deployments/:id/stop', ({ params }) => {
        stopped.push(params.id as string)
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const user = userEvent.setup()

    renderList()
    await screen.findAllByText('postgres-prod')

    const table = screen.getByRole('table')
    await user.click(within(table).getByRole('checkbox', { name: /Tout sélectionner/ }))
    await user.click(screen.getByRole('button', { name: /Arrêter/ }))

    await waitFor(() => {
      expect(stopped).toEqual(expect.arrayContaining(['dep-1', 'dep-2']))
    })
    expect(await screen.findByText(/2 déploiements arrêtés/)).toBeInTheDocument()
  })

  it('affiche un succès partiel quand un item échoue', async () => {
    server.use(
      http.get('*/deployments', () =>
        HttpResponse.json([deploymentDto(), deploymentDto({ id: 'dep-2', name: 'redis-cache' })]),
      ),
      http.post('*/deployments/dep-1/stop', () => new HttpResponse(null, { status: 202 })),
      http.post('*/deployments/dep-2/stop', () => new HttpResponse(null, { status: 409 })),
    )
    const user = userEvent.setup()

    renderList()
    await screen.findAllByText('postgres-prod')

    const table = screen.getByRole('table')
    await user.click(within(table).getByRole('checkbox', { name: /Tout sélectionner/ }))
    await user.click(screen.getByRole('button', { name: /Arrêter/ }))

    expect(await screen.findByText(/1 déploiement arrêté.*1 a échoué/)).toBeInTheDocument()
  })

  it('confirme avant la suppression groupée puis appelle destroy', async () => {
    const destroyed: string[] = []
    server.use(
      http.get('*/deployments', () => HttpResponse.json([deploymentDto()])),
      http.post('*/deployments/:id/destroy', ({ params }) => {
        destroyed.push(params.id as string)
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const user = userEvent.setup()

    renderList()
    await screen.findAllByText('postgres-prod')

    const table = screen.getByRole('table')
    await user.click(within(table).getByRole('checkbox', { name: /Tout sélectionner/ }))
    await user.click(screen.getByRole('button', { name: /Supprimer/ }))

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    await waitFor(() => {
      expect(destroyed).toEqual(['dep-1'])
    })
  })
})
