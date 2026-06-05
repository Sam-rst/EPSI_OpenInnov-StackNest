import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Avatar } from '../Avatar'

describe('Avatar', () => {
  it('calcule les initiales (2 max) depuis le nom complet', () => {
    render(<Avatar name="Yassine Zouitni" />)

    expect(screen.getByText('YZ')).toBeInTheDocument()
  })

  it('gère un prénom seul (une seule initiale)', () => {
    render(<Avatar name="Samuel" />)

    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('ignore les espaces superflus et met en majuscules', () => {
    render(<Avatar name="  ada  lovelace  " />)

    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('applique la taille fournie (largeur et hauteur)', () => {
    render(<Avatar name="Test User" size={40} />)

    const el = screen.getByText('TU')
    expect(el).toHaveStyle({ width: '40px', height: '40px' })
  })

  it('expose un rôle img avec le nom complet comme libellé accessible', () => {
    render(<Avatar name="Yassine Zouitni" />)

    expect(screen.getByRole('img', { name: 'Yassine Zouitni' })).toBeInTheDocument()
  })
})
