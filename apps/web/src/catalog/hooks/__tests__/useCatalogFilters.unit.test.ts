import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '../../domain/models/CatalogItem'
import { EngineKind } from '../../types/enums/EngineKind'
import { useCatalogFilters } from '../useCatalogFilters'

const ITEMS: readonly CatalogItem[] = [
  {
    id: 'pg',
    name: 'PostgreSQL',
    icon: 'database',
    category: 'Database',
    provider: 'Docker',
    engine: EngineKind.DOCKER,
    tags: ['SQL'],
    description: 'Base relationnelle managée.',
    deployable: true,
  },
  {
    id: 'redis',
    name: 'Redis',
    icon: 'server',
    category: 'Cache',
    provider: 'Docker',
    engine: EngineKind.DOCKER,
    tags: ['Cache'],
    description: 'Store clé-valeur en mémoire.',
    deployable: true,
  },
  {
    id: 'vm',
    name: 'VM Ubuntu',
    icon: 'monitor',
    category: 'Compute',
    provider: 'Terraform',
    engine: EngineKind.TERRAFORM,
    tags: ['VM'],
    description: 'Machine virtuelle Linux.',
    deployable: true,
  },
]

describe('useCatalogFilters', () => {
  it('initialise les filtres sur « Tous » et une recherche vide', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    expect(result.current.filterCategory).toBe('Tous')
    expect(result.current.filterProvider).toBe('Tous')
    expect(result.current.search).toBe('')
  })

  it('dérive les catégories uniques préfixées de « Tous »', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    expect(result.current.categories).toEqual(['Tous', 'Database', 'Cache', 'Compute'])
  })

  it('dérive les providers uniques préfixés de « Tous »', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    expect(result.current.providers).toEqual(['Tous', 'Docker', 'Terraform'])
  })

  it('retourne tous les items par défaut', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    expect(result.current.filtered).toHaveLength(3)
  })

  it('filtre par catégorie', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    act(() => {
      result.current.setFilterCategory('Cache')
    })

    expect(result.current.filtered.map((item) => item.id)).toEqual(['redis'])
  })

  it('filtre par provider', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    act(() => {
      result.current.setFilterProvider('Terraform')
    })

    expect(result.current.filtered.map((item) => item.id)).toEqual(['vm'])
  })

  it('recherche dans le nom (insensible à la casse)', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    act(() => {
      result.current.setSearch('redis')
    })

    expect(result.current.filtered.map((item) => item.id)).toEqual(['redis'])
  })

  it('recherche dans la description', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    act(() => {
      result.current.setSearch('virtuelle')
    })

    expect(result.current.filtered.map((item) => item.id)).toEqual(['vm'])
  })

  it('combine catégorie, provider et recherche', () => {
    const { result } = renderHook(() => useCatalogFilters(ITEMS))

    act(() => {
      result.current.setFilterProvider('Docker')
      result.current.setSearch('store')
    })

    expect(result.current.filtered.map((item) => item.id)).toEqual(['redis'])
  })
})
