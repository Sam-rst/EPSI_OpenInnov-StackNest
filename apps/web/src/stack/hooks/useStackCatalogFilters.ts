import { useMemo, useState } from 'react'

import type { CatalogItem } from '../../catalog/domain/models/CatalogItem'

/** Sens du tri alphabétique sur le nom du service. */
export type SortDir = 'asc' | 'desc'

interface UseStackCatalogFiltersResult {
  search: string
  setSearch: (value: string) => void
  filterCategory: string
  setFilterCategory: (value: string) => void
  popularOnly: boolean
  setPopularOnly: (value: boolean) => void
  sortDir: SortDir
  setSortDir: (value: SortDir) => void
  /** Catégories disponibles, « Toutes » en tête. */
  categories: readonly string[]
  /** Éléments filtrés puis triés par nom. */
  filtered: readonly CatalogItem[]
}

const ALL = 'Toutes'

const matchesSearch = (item: CatalogItem, search: string): boolean => {
  if (!search) {
    return true
  }
  const query = search.toLowerCase()
  return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
}

/**
 * Filtrage / tri client du catalogue dans le **builder de stack** : recherche
 * (nom + description), filtre par catégorie, restriction aux services populaires
 * et tri alphabétique. Logique inspirée de `useCatalogFilters` (catalogue), mais
 * propre au slice stack et enrichie du tri + populaire pour composer vite.
 */
export function useStackCatalogFilters(
  items: readonly CatalogItem[],
): UseStackCatalogFiltersResult {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState(ALL)
  const [popularOnly, setPopularOnly] = useState(false)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  )

  const filtered = useMemo(() => {
    const matched = items.filter(
      (item) =>
        (filterCategory === ALL || item.category === filterCategory) &&
        (!popularOnly || item.popular === true) &&
        matchesSearch(item, search),
    )
    const direction = sortDir === 'asc' ? 1 : -1
    return [...matched].sort((a, b) => direction * a.name.localeCompare(b.name, 'fr'))
  }, [items, filterCategory, popularOnly, search, sortDir])

  return {
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    popularOnly,
    setPopularOnly,
    sortDir,
    setSortDir,
    categories,
    filtered,
  }
}
