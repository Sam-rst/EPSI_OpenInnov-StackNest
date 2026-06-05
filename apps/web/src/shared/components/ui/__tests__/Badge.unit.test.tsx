import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from '../Badge'

describe('Badge', () => {
  it('affiche son contenu', () => {
    render(<Badge>Populaire</Badge>)

    expect(screen.getByText('Populaire')).toBeInTheDocument()
  })

  it('applique le tone neutral par défaut', () => {
    render(<Badge>Neutre</Badge>)

    expect(screen.getByText('Neutre')).toHaveClass('bg-surface-sunken')
  })

  it('applique le tone demandé', () => {
    render(<Badge tone="yellow">Populaire</Badge>)

    expect(screen.getByText('Populaire').className).toContain('text-[#9b5805]')
  })

  it('conserve les classes de base (badge pill)', () => {
    render(<Badge>X</Badge>)
    const el = screen.getByText('X')

    expect(el).toHaveClass('inline-flex')
    expect(el).toHaveClass('rounded-md')
    expect(el).toHaveClass('uppercase')
  })

  it('fusionne une className fournie', () => {
    render(<Badge className="ml-2">X</Badge>)

    expect(screen.getByText('X')).toHaveClass('ml-2')
  })
})
