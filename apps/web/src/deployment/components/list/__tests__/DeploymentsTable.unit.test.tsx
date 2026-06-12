import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { DeploymentStatus } from '../../../types/enums/DeploymentStatus'
import type { Deployment } from '../../../types/models/Deployment'
import { DeploymentsTable, type TableSelection } from '../DeploymentsTable'

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

function renderTable(deployments: readonly Deployment[], selection?: TableSelection) {
  return render(
    <MemoryRouter>
      <DeploymentsTable deployments={deployments} selection={selection} />
    </MemoryRouter>,
  )
}

function selectionStub(overrides: Partial<TableSelection> = {}): TableSelection {
  return {
    allSelected: false,
    someSelected: false,
    onToggleAll: vi.fn(),
    isSelected: () => false,
    onToggle: vi.fn(),
    ...overrides,
  }
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

  it('sans sélection : aucune case à cocher (comportement existant préservé)', () => {
    renderTable([deployment()])

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('avec sélection : case d’en-tête « tout sélectionner » dans la table', () => {
    renderTable([deployment()], selectionStub())

    expect(screen.getByRole('checkbox', { name: /Tout sélectionner/ })).toBeInTheDocument()
  })

  it('case d’en-tête indéterminée quand sélection partielle', () => {
    renderTable([deployment()], selectionStub({ someSelected: true }))

    const headerBox = screen.getByRole('checkbox', { name: /Tout sélectionner/ })
    expect(headerBox).toHaveProperty('indeterminate', true)
  })

  it('case d’en-tête cochée quand tout est sélectionné', () => {
    renderTable([deployment()], selectionStub({ allSelected: true }))

    expect(screen.getByRole('checkbox', { name: /Tout sélectionner/ })).toBeChecked()
  })

  it('déclenche onToggleAll au clic sur la case d’en-tête', async () => {
    const onToggleAll = vi.fn()
    const user = userEvent.setup()
    renderTable([deployment()], selectionStub({ onToggleAll }))

    await user.click(screen.getByRole('checkbox', { name: /Tout sélectionner/ }))

    expect(onToggleAll).toHaveBeenCalledTimes(1)
  })

  it('reflète l’état coché d’une ligne et déclenche onToggle', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    renderTable([deployment()], selectionStub({ isSelected: (id) => id === 'dep-1', onToggle }))

    const table = screen.getByRole('table')
    const rowBox = within(table).getByRole('checkbox', { name: /Sélectionner postgres-prod/ })
    expect(rowBox).toBeChecked()

    await user.click(rowBox)
    expect(onToggle).toHaveBeenCalledWith('dep-1')
  })
})
