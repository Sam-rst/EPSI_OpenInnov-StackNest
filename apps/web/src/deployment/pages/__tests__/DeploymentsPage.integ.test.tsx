import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import * as service from '../../services/deploymentService'
import { DeploymentsPage } from '../DeploymentsPage'

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
    vi.restoreAllMocks()
  })

  it('affiche la table des déploiements d’exemple (seam par défaut)', async () => {
    renderList()

    expect(await screen.findByText('postgresql-exemple')).toBeInTheDocument()
    expect(screen.getByText('redis-cache-exemple')).toBeInTheDocument()
    // En-tête + CTA présents.
    expect(screen.getByRole('button', { name: /Nouveau déploiement/ })).toBeInTheDocument()
  })

  it('affiche un état vide honnête quand il n’y a aucun déploiement', async () => {
    vi.spyOn(service, 'listDeployments').mockResolvedValue([])

    renderList()

    expect(await screen.findByText('Aucun déploiement')).toBeInTheDocument()
    expect(
      screen.getByText(/Provisionne ta première ressource depuis le catalogue/),
    ).toBeInTheDocument()
  })

  it('affiche un état d’erreur avec réessai', async () => {
    vi.spyOn(service, 'listDeployments').mockRejectedValue(new Error('boom'))

    renderList()

    expect(await screen.findByText('Impossible de charger les déploiements')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Réessayer/ })).toBeInTheDocument()
  })
})
