import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { DeploymentStatus } from '../../../types/enums/DeploymentStatus'
import type { Deployment } from '../../../types/models/Deployment'
import { DeploymentsTable } from '../DeploymentsTable'

function deployment(overrides: Partial<Deployment> = {}): Deployment {
  return {
    id: 'dep-1',
    templateId: 'pg16',
    templateName: 'PostgreSQL',
    version: '16',
    name: 'postgres-prod',
    status: DeploymentStatus.RUNNING,
    statusLabel: 'En ligne',
    params: {},
    host: '10.0.0.5',
    port: 32769,
    accessUrl: '10.0.0.5:32769',
    connectionUsername: 'postgres',
    createdAt: '2026-06-07T09:12:00Z',
    updatedAt: '2026-06-07T09:13:10Z',
    ...overrides,
  }
}

function renderTable(deployments: readonly Deployment[]) {
  return render(
    <MemoryRouter>
      <DeploymentsTable deployments={deployments} />
    </MemoryRouter>,
  )
}

describe('DeploymentsTable (responsive)', () => {
  it('rend une table accessible en affichage large', () => {
    renderTable([deployment()])

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('masque la table sous le point de rupture md (cartes empilées à la place)', () => {
    renderTable([deployment()])

    // La table reste dans le DOM mais est masquée en mobile (md:table / hidden).
    const table = screen.getByRole('table')
    const tableWrapper = table.parentElement
    expect(tableWrapper).toHaveClass('hidden')
    expect(tableWrapper?.className).toMatch(/md:block/)
  })

  it('rend une liste de cartes empilées dédiée au mobile (masquée en large)', () => {
    renderTable([deployment()])

    const cardsContainer = screen.getByTestId('deployments-cards')
    expect(cardsContainer).toBeInTheDocument()
    expect(cardsContainer.className).toMatch(/md:hidden/)
  })

  it('ne déborde pas horizontalement : la table est dans un conteneur scrollable', () => {
    renderTable([deployment()])

    const tableWrapper = screen.getByRole('table').parentElement
    expect(tableWrapper?.className).toMatch(/overflow-x-auto/)
  })

  it('affiche chaque déploiement une seule fois par mode (pas de doublon de nom rendu deux fois visuellement)', () => {
    renderTable([deployment(), deployment({ id: 'dep-2', name: 'redis-cache' })])

    // Présent dans les deux modes (table + cartes), donc 2 occurrences attendues par nom.
    expect(screen.getAllByText('postgres-prod')).toHaveLength(2)
    expect(screen.getAllByText('redis-cache')).toHaveLength(2)
  })
})
