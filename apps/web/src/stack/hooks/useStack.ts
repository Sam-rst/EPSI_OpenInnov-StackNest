import { useQuery } from '@tanstack/react-query'

import { getStack } from '../services/stackService'
import type { StackDetailModel } from '../types/models/Stack'

/** Clé React Query du détail d'une stack. */
export function stackQueryKey(id: string): readonly [string, string] {
  return ['stack', id]
}

interface UseStackResult {
  stack: StackDetailModel | undefined
  loading: boolean
  isError: boolean
}

/**
 * Charge le détail d'une stack possédée (`GET /stacks/{id}`). Désactivée tant
 * que l'`id` est absent (aucune requête déclenchée).
 */
export function useStack(id: string | undefined): UseStackResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: stackQueryKey(id ?? ''),
    queryFn: () => getStack(id as string),
    enabled: Boolean(id),
  })

  return {
    stack: data,
    loading: Boolean(id) && isLoading,
    isError,
  }
}
