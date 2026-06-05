import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Features } from '../Features'

describe('Features', () => {
  it('rend une section ancrable #features avec son titre', () => {
    const { container } = render(<Features />)

    expect(container.querySelector('#features')).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: /tout ce qu'il faut, rien de plus/i }),
    ).toBeInTheDocument()
  })

  it('affiche les 4 features clés avec leur démo interne', () => {
    render(<Features />)

    expect(screen.getByText('Catalogue de ressources')).toBeInTheDocument()
    expect(screen.getByText('ChatOps IA')).toBeInTheDocument()
    expect(screen.getByText('Plan Terraform live')).toBeInTheDocument()
    expect(screen.getByText('Suivi en temps réel')).toBeInTheDocument()
  })

  it('rend la démo ChatOps avec un échange illustratif', () => {
    render(<Features />)

    expect(screen.getByText(/je veux postgres \+ redis isolé/i)).toBeInTheDocument()
  })
})
