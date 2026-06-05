import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StackMarquee } from '../StackMarquee'

describe('StackMarquee', () => {
  it('rend une section ancrable #stack avec son titre honnête', () => {
    const { container } = render(<StackMarquee />)

    expect(container.querySelector('#stack')).not.toBeNull()
    expect(screen.getByRole('heading', { name: /sous le capot, du solide/i })).toBeInTheDocument()
  })

  it('affiche les briques techniques en deux rangées dupliquées (animation marquee)', () => {
    const { container } = render(<StackMarquee />)

    expect(container.querySelectorAll('.marketing-marquee-track')).toHaveLength(2)
    // Chaque rangée duplique ses items pour la boucle infinie : Terraform y figure deux fois.
    expect(screen.getAllByText('Terraform').length).toBeGreaterThanOrEqual(2)
  })
})
