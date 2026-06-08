import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { DeploymentStatus } from '../../../../deployment/types/enums/DeploymentStatus'
import type { Deployment } from '../../../../deployment/types/models/Deployment'
import { ContextAside } from '../ContextAside'

function deployment(overrides: Partial<Deployment> = {}): Deployment {
  return {
    id: 'dep-1',
    templateId: 'pg16',
    version: '16',
    name: 'postgres-prod',
    status: DeploymentStatus.RUNNING,
    statusLabel: 'En ligne',
    params: {},
    host: '10.0.0.5',
    port: 32769,
    accessUrl: '10.0.0.5:32769',
    createdAt: '2026-06-08T10:00:00Z',
    updatedAt: '2026-06-08T11:00:00Z',
    ...overrides,
  }
}

function renderAside(overrides: Partial<Parameters<typeof ContextAside>[0]> = {}) {
  const props = { deployments: [deployment()], loading: false, isError: false, ...overrides }
  render(
    <MemoryRouter>
      <ContextAside {...props} />
    </MemoryRouter>,
  )
  return props
}

describe('ContextAside', () => {
  it('liste les déploiements actifs avec leur statut', () => {
    renderAside()

    expect(screen.getByText('postgres-prod')).toBeInTheDocument()
    expect(screen.getByText('En ligne')).toBeInTheDocument()
  })

  it('lie chaque déploiement vers sa page de détail', () => {
    renderAside()

    const link = screen.getByRole('link', { name: /postgres-prod/ })
    expect(link).toHaveAttribute('href', '/deployments/dep-1')
  })

  it('affiche un état vide honnête sans déploiement', () => {
    renderAside({ deployments: [] })

    expect(screen.getByText(/Aucun déploiement actif/)).toBeInTheDocument()
  })

  it('affiche un état d’erreur honnête', () => {
    renderAside({ isError: true, deployments: [] })

    expect(screen.getByText(/indisponible/i)).toBeInTheDocument()
  })
})
