import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '../../domain/models/CatalogItem'
import { CatalogCard } from '../CatalogCard'

const ITEM: CatalogItem = {
  id: 'pg',
  name: 'PostgreSQL',
  icon: 'database',
  category: 'Database',
  provider: 'Docker',
  tags: ['SQL', 'Persistant'],
  description: 'Base relationnelle managée.',
  popular: true,
}

describe('CatalogCard', () => {
  it('affiche le nom, la méta et la description', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    expect(screen.getByText('Database · via Docker')).toBeInTheDocument()
    expect(screen.getByText('Base relationnelle managée.')).toBeInTheDocument()
  })

  it('affiche les tags', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('SQL')).toBeInTheDocument()
    expect(screen.getByText('Persistant')).toBeInTheDocument()
  })

  it('affiche le badge « Populaire » pour un item populaire', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Populaire')).toBeInTheDocument()
  })

  it('masque le badge « Populaire » sinon', () => {
    render(<CatalogCard item={{ ...ITEM, popular: false }} onSelect={vi.fn()} />)

    expect(screen.queryByText('Populaire')).not.toBeInTheDocument()
  })

  it('rend une icône', () => {
    const { container } = render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('appelle onSelect avec l’item au clic', async () => {
    const onSelect = vi.fn()
    render(<CatalogCard item={ITEM} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith(ITEM)
  })
})

describe('CatalogCard — responsivité (anti-débordement)', () => {
  it('ne tronque pas le nom et laisse le badge passer à la ligne sur une carte étroite', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    const name = screen.getByText('PostgreSQL')
    // Le nom (parfois long, ex. « Conteneur Node.js ») est essentiel : jamais tronqué à « P… ».
    expect(name).not.toHaveClass('truncate')
    // La rangée titre + badge peut wrapper pour ne jamais écraser le nom.
    expect(name.parentElement).toHaveClass('flex-wrap')
  })

  it('tronque la méta « catégorie · provider »', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Database · via Docker')).toHaveClass('truncate')
  })

  it('garde le CTA « Configurer » sur une seule ligne', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    const cta = screen.getByText('Configurer →')
    expect(cta).toHaveClass('whitespace-nowrap')
    expect(cta).toHaveClass('shrink-0')
  })

  it('empêche le badge « Populaire » de se faire écraser', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Populaire')).toHaveClass('shrink-0')
  })
})
