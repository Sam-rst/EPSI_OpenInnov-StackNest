import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LogoMark } from '../LogoMark'

describe('LogoMark', () => {
  it('rend une image accessible nommée StackNest (variante couleur par défaut)', () => {
    render(<LogoMark />)

    expect(screen.getByRole('img', { name: 'StackNest' })).toHaveAttribute(
      'src',
      '/assets/logo.svg',
    )
  })

  it('sélectionne le fichier correspondant à la variante mono demandée', () => {
    render(<LogoMark variant="mono-white" />)

    expect(screen.getByRole('img', { name: 'StackNest' })).toHaveAttribute(
      'src',
      '/assets/logo-mono-white.svg',
    )
  })

  it('préserve le ratio natif 97x127 selon la taille demandée', () => {
    render(<LogoMark size={97} />)

    const img = screen.getByRole('img', { name: 'StackNest' })
    expect(img).toHaveAttribute('width', '97')
    expect(img).toHaveAttribute('height', '127')
  })

  it('transmet la className', () => {
    render(<LogoMark className="h-8" />)

    expect(screen.getByRole('img', { name: 'StackNest' })).toHaveClass('h-8')
  })
})
