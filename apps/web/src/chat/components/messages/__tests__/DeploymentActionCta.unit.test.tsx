import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { DeploymentActionCta } from '../DeploymentActionCta'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function renderCta(precedingText = '') {
  render(
    <MemoryRouter>
      <DeploymentActionCta templateId="pg16" precedingText={precedingText} />
    </MemoryRouter>,
  )
}

describe('DeploymentActionCta', () => {
  it('affiche un CTA « Configurer ce déploiement »', () => {
    renderCta()

    expect(screen.getByRole('button', { name: /Configurer ce déploiement/ })).toBeInTheDocument()
  })

  it('navigue vers la config préremplie au clic', async () => {
    const user = userEvent.setup()
    renderCta()

    await user.click(screen.getByRole('button', { name: /Configurer ce déploiement/ }))

    expect(navigateMock).toHaveBeenCalledWith('/deployments/config?template=pg16')
  })

  it('affiche le texte d’accompagnement quand il existe', () => {
    renderCta('Voici ma proposition de déploiement')

    expect(screen.getByText(/Voici ma proposition/)).toBeInTheDocument()
  })

  it('n’affiche pas de JSON brut', () => {
    renderCta('Texte avant')

    expect(screen.queryByText(/template_id/)).toBeNull()
  })
})
