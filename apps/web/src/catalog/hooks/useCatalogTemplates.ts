import { useQuery } from '@tanstack/react-query'

import type { CatalogItem } from '../domain/models/CatalogItem'
import { listTemplates } from '../services/templateService'

/** Clé React Query de la liste du catalogue (catalogue complet, filtrage client). */
export const CATALOG_TEMPLATES_QUERY_KEY = ['catalog', 'templates'] as const

interface UseCatalogTemplatesResult {
  items: readonly CatalogItem[]
  loading: boolean
  isError: boolean
}

const EMPTY_ITEMS: readonly CatalogItem[] = []

/**
 * Charge le catalogue complet via React Query (`GET /catalog/templates`).
 * Renvoie la forme `{ items, loading, isError }` consommée par `CatalogPage` ;
 * le filtrage reste assuré côté client par `useCatalogFilters`.
 */
export function useCatalogTemplates(): UseCatalogTemplatesResult {
  const { data, isPending, isError } = useQuery({
    queryKey: CATALOG_TEMPLATES_QUERY_KEY,
    queryFn: listTemplates,
  })

  return {
    items: data ?? EMPTY_ITEMS,
    loading: isPending,
    isError,
  }
}
