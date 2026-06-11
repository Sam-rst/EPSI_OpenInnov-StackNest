import { useQuery } from '@tanstack/react-query'

import { listStacks } from '../services/stackService'
import type { StackSummary } from '../types/models/Stack'

/** Clé React Query de la liste des stacks. */
export const STACKS_QUERY_KEY = ['stacks'] as const

interface UseStacksResult {
  stacks: readonly StackSummary[]
  loading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Charge la liste des stacks via React Query (`GET /stacks`). Renvoie une liste
 * vide tant que la requête n'a pas abouti, pour simplifier le rendu des états.
 */
export function useStacks(): UseStacksResult {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: STACKS_QUERY_KEY,
    queryFn: listStacks,
  })

  return {
    stacks: data ?? [],
    loading: isPending,
    isError,
    refetch: () => {
      void refetch()
    },
  }
}
