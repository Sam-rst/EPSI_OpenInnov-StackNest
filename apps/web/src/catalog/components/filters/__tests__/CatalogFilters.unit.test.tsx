import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '../../../domain/models/CatalogItem'
import { CatalogFilters } from '../CatalogFilters'

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
    id: 'vm',
    name: 'VM Ubuntu',
    icon: 'monitor',
    category: 'Compute',
    provider: 'Terraform',
    tags: ['VM'],
    description: 'Machine virtuelle.',
  },
]

function renderFilters(overrides: Partial<Parameters<typeof CatalogFilters>[0]> = {}) {
  return render(
    <MemoryRouter>
      <CatalogFilters
        search=""
        setSearch={vi.fn()}
        categories={['Tous', 'Database', 'Compute']}
        filterCategory="Tous"
        setFilterCategory={vi.fn()}
        providers={['Tous', 'Docker', 'Terraform']}
        filterProvider="Tous"
        setFilterProvider={vi.fn()}
        allItems={ITEMS}
        {...overrides}
      />
    </MemoryRouter>,
  )
}

describe('CatalogFilters', () => {
  it('assemble recherche, catégories, providers et ChatOps', () => {
    renderFilters()

    expect(screen.getByText('Recherche')).toBeInTheDocument()
    expect(screen.getByText('Catégorie')).toBeInTheDocument()
    expect(screen.getByText('Provider')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ouvrir ChatOps/ })).toBeInTheDocument()
  })

  it('affiche le compteur « Tous » égal au nombre total d’items', () => {
    renderFilters()

    const tousButtons = screen.getAllByRole('button', { name: /Tous/ })

    expect(tousButtons.some((button) => button.textContent?.includes('2'))).toBe(true)
  })
})
