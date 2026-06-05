import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '../../domain/models/CatalogItem'
import { CatalogGrid } from '../CatalogGrid'

const ITEMS: readonly CatalogItem[] = [
  {
    id: 'pg',
    name: 'PostgreSQL',
    icon: 'database',
    category: 'Database',
    provider: 'Docker',
    tags: ['SQL'],
    description: 'Base relationnelle.',
  },
  {
    id: 'redis',
    name: 'Redis',
    icon: 'server',
    category: 'Cache',
    provider: 'Docker',
    tags: ['Cache'],
    description: 'Store clé-valeur.',
  },
]

describe('CatalogGrid', () => {
  it('rend une carte par item', () => {
    render(<CatalogGrid items={ITEMS} onSelect={vi.fn()} />)

    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    expect(screen.getByText('Redis')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('ne rend aucune carte pour une liste vide', () => {
    render(<CatalogGrid items={[]} onSelect={vi.fn()} />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('relaie onSelect avec l’item cliqué', async () => {
    const onSelect = vi.fn()
    render(<CatalogGrid items={ITEMS} onSelect={onSelect} />)

    await userEvent.click(screen.getByText('Redis'))

    expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
  })

  it('utilise une grille fluide auto-fit (jamais de carte écrasée, pas de breakpoint rigide)', () => {
    render(<CatalogGrid items={ITEMS} onSelect={vi.fn()} />)

    const grid = screen.getByRole('list')
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('grid-cols-[repeat(auto-fill,minmax(min(100%,13.5rem),1fr))]')
    expect(grid).not.toHaveClass('md:grid-cols-2')
    expect(grid).not.toHaveClass('xl:grid-cols-3')
  })
})
