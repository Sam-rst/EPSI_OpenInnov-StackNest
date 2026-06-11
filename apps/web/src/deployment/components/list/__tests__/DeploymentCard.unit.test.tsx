import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { DeploymentStatus } from '../../../types/enums/DeploymentStatus'
import type { Deployment } from '../../../types/models/Deployment'
import { DeploymentCard } from '../DeploymentCard'

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

function renderCard(model: Deployment) {
  return render(
    <MemoryRouter initialEntries={['/deployments']}>
      <Routes>
        <Route path="/deployments" element={<DeploymentCard deployment={model} />} />
        <Route path="/deployments/:id" element={<div>Page détail dep-1</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DeploymentCard (affichage mobile)', () => {
  it('affiche le nom, le template+version, le statut, l’accès et la date', () => {
    renderCard(deployment())

    expect(screen.getByText('postgres-prod')).toBeInTheDocument()
    expect(screen.getByText(/PostgreSQL · 16/)).toBeInTheDocument()
    expect(screen.getByText('En ligne')).toBeInTheDocument()
    expect(screen.getByText('10.0.0.5:32769')).toBeInTheDocument()
  })

  it('expose la carte entière comme un lien accessible vers le détail', () => {
    renderCard(deployment())

    expect(screen.getByRole('link', { name: /postgres-prod/ })).toBeInTheDocument()
  })

  it('navigue vers le détail au clic sur la carte', async () => {
    const user = userEvent.setup()
    renderCard(deployment())

    await user.click(screen.getByText('postgres-prod'))

    expect(screen.getByText('Page détail dep-1')).toBeInTheDocument()
  })

  it('retombe sur l’UUID du template quand le nom lisible est absent', () => {
    renderCard(deployment({ templateName: undefined }))

    expect(screen.getByText(/pg16 · 16/)).toBeInTheDocument()
  })
})
