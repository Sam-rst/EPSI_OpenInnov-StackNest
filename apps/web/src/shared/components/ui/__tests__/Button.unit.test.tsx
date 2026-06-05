import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '../Button'

describe('Button', () => {
  it('affiche son libellé', () => {
    render(<Button>Valider</Button>)

    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument()
  })

  it('applique la variante primary (jaune) par défaut', () => {
    render(<Button>Défaut</Button>)

    expect(screen.getByRole('button')).toHaveClass('bg-yellow')
  })

  it('applique la variante demandée', () => {
    render(<Button variant="cyan">Cyan</Button>)

    expect(screen.getByRole('button')).toHaveClass('bg-cyan')
  })

  it('applique la taille demandée', () => {
    render(<Button size="sm">Petit</Button>)

    expect(screen.getByRole('button')).toHaveClass('h-8')
  })

  it('rend une icône à gauche', () => {
    const { container } = render(<Button icon="plus">Ajouter</Button>)

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('rend une icône à gauche et à droite', () => {
    const { container } = render(
      <Button icon="plus" iconRight="arrow-right">
        Suivant
      </Button>,
    )

    expect(container.querySelectorAll('svg')).toHaveLength(2)
  })

  it('transmet la className fournie', () => {
    render(<Button className="w-full">Large</Button>)

    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('transmet les props natives (onClick)', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clic</Button>)

    screen.getByRole('button').click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('transmet la ref vers le bouton natif', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
