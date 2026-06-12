import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '../../../catalog/domain/models/CatalogItem'
import { EngineKind } from '../../../catalog/types/enums/EngineKind'
import { useStackCatalogFilters } from '../useStackCatalogFilters'

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'pg',
    name: 'PostgreSQL',
    icon: 'database',
    category: 'Base de données',
    provider: 'Bitnami',
    engine: EngineKind.DOCKER,
    tags: ['sql'],
    description: 'Base relationnelle',
    popular: false,
    deployable: true,
    ...overrides,
  }
}

const ITEMS: readonly CatalogItem[] = [
  item({ id: 'pg', name: 'PostgreSQL', category: 'Base de données', popular: true }),
  item({ id: 'redis', name: 'Redis', category: 'Cache', popular: false }),
  item({ id: 'mongo', name: 'MongoDB', category: 'Base de données', popular: false }),
]

describe('useStackCatalogFilters', () => {
  it('renvoie tous les éléments par défaut, triés A→Z par nom', () => {
    const { result } = renderHook(() => useStackCatalogFilters(ITEMS))

    expect(result.current.filtered.map((entry) => entry.name)).toEqual([
      'MongoDB',
      'PostgreSQL',
      'Redis',
    ])
  })

  it('filtre par recherche (nom)', () => {
    const { result } = renderHook(() => useStackCatalogFilters(ITEMS))

    act(() => result.current.setSearch('mongo'))

    expect(result.current.filtered.map((entry) => entry.id)).toEqual(['mongo'])
  })

  it('filtre par catégorie', () => {
    const { result } = renderHook(() => useStackCatalogFilters(ITEMS))

    act(() => result.current.setFilterCategory('Cache'))

    expect(result.current.filtered.map((entry) => entry.id)).toEqual(['redis'])
  })

  it('expose les catégories disponibles avec « Toutes » en tête', () => {
    const { result } = renderHook(() => useStackCatalogFilters(ITEMS))

    expect(result.current.categories).toEqual(['Toutes', 'Base de données', 'Cache'])
  })

  it('ne garde que les populaires quand le filtre est activé', () => {
    const { result } = renderHook(() => useStackCatalogFilters(ITEMS))

    act(() => result.current.setPopularOnly(true))

    expect(result.current.filtered.map((entry) => entry.id)).toEqual(['pg'])
  })

  it('trie Z→A quand demandé', () => {
    const { result } = renderHook(() => useStackCatalogFilters(ITEMS))

    act(() => result.current.setSortDir('desc'))

    expect(result.current.filtered.map((entry) => entry.name)).toEqual([
      'Redis',
      'PostgreSQL',
      'MongoDB',
    ])
  })

  it('combine recherche + catégorie + populaire', () => {
    const { result } = renderHook(() => useStackCatalogFilters(ITEMS))

    act(() => {
      result.current.setFilterCategory('Base de données')
      result.current.setPopularOnly(true)
    })

    expect(result.current.filtered.map((entry) => entry.id)).toEqual(['pg'])
  })
})
