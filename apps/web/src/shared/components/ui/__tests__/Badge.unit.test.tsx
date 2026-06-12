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

    expect(screen.getByText('Populaire').className).toContain('text-[#7a4604]')
  })

  it('renforce le contraste du tone yellow en thème sombre (texte clair)', () => {
    render(<Badge tone="yellow">Populaire</Badge>)

    // En sombre, le texte ambré foncé deviendrait illisible : on bascule sur un
    // jaune clair via la variante `dark:` pour garantir le ratio AA.
    expect(screen.getByText('Populaire').className).toContain('dark:text-[#ffd07a]')
  })

  it('renforce le contraste du tone warn en thème sombre (texte clair)', () => {
    render(<Badge tone="warn">Bientôt disponible</Badge>)

    expect(screen.getByText('Bientôt disponible').className).toContain('dark:text-[#ffd07a]')
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
