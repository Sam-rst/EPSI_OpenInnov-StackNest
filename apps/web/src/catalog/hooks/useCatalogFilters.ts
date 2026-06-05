import { useMemo, useState } from 'react'

import type { CatalogItem } from '../domain/models/CatalogItem'

interface UseCatalogFiltersResult {
  filterCategory: string
  filterProvider: string
  search: string
  setFilterCategory: (value: string) => void
  setFilterProvider: (value: string) => void
  setSearch: (value: string) => void
  categories: readonly string[]
  providers: readonly string[]
  filtered: readonly CatalogItem[]
}

const ALL = 'Tous'

const matchesSearch = (item: CatalogItem, search: string): boolean => {
  if (!search) {
    return true
  }
  const query = search.toLowerCase()
  return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
}

/** Filtrage client (catégorie + provider + recherche) sur le catalogue complet. */
export function useCatalogFilters(items: readonly CatalogItem[]): UseCatalogFiltersResult {
  const [filterCategory, setFilterCategory] = useState(ALL)
  const [filterProvider, setFilterProvider] = useState(ALL)
  const [search, setSearch] = useState('')

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  )
  const providers = useMemo(
    () => [ALL, ...Array.from(new Set(items.map((item) => item.provider)))],
    [items],
  )

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (filterCategory === ALL || item.category === filterCategory) &&
          (filterProvider === ALL || item.provider === filterProvider) &&
          matchesSearch(item, search),
      ),
    [items, filterCategory, filterProvider, search],
  )

  return {
    filterCategory,
    filterProvider,
    search,
    setFilterCategory,
    setFilterProvider,
    setSearch,
    categories,
    providers,
    filtered,
  }
}
