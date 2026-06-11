import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { DeploymentResultCta } from '../DeploymentResultCta'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function renderCta(deploymentId = 'dep-1') {
  render(
    <MemoryRouter>
      <DeploymentResultCta deploymentId={deploymentId} />
    </MemoryRouter>,
  )
}

describe('DeploymentResultCta', () => {
  it('affiche un CTA « Voir le déploiement »', () => {
    renderCta()

    expect(screen.getByRole('button', { name: /Voir le déploiement/ })).toBeInTheDocument()
  })

  it('navigue vers le détail du déploiement au clic', async () => {
    const user = userEvent.setup()
    renderCta('dep-42')

    await user.click(screen.getByRole('button', { name: /Voir le déploiement/ }))

    expect(navigateMock).toHaveBeenCalledWith('/deployments/dep-42')
  })
})
