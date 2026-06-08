import { useQuery } from '@tanstack/react-query'

import { listDeployments } from '../services/deploymentService'
import type { Deployment } from '../types/models/Deployment'

/** Clé React Query de la liste des déploiements. */
export const DEPLOYMENTS_QUERY_KEY = ['deployments'] as const

interface UseDeploymentsResult {
  deployments: readonly Deployment[]
  loading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Charge la liste des déploiements via React Query (seam display-only →
 * `GET /deployments` au branchement). Renvoie une liste vide tant que la
 * requête n'a pas abouti, pour simplifier le rendu des états (vide/skeleton).
 */
export function useDeployments(): UseDeploymentsResult {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: DEPLOYMENTS_QUERY_KEY,
    queryFn: () => listDeployments(),
  })

  return {
    deployments: data ?? [],
    loading: isLoading,
    isError,
    refetch: () => {
      void refetch()
    },
  }
}
