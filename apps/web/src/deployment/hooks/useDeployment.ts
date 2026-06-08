import { useQuery } from '@tanstack/react-query'

import { getDeployment } from '../services/deploymentService'
import type { Deployment } from '../types/models/Deployment'

/** Clé React Query du détail d'un déploiement. */
export function deploymentQueryKey(id: string): readonly [string, string] {
  return ['deployment', id]
}

interface UseDeploymentResult {
  deployment: Deployment | undefined
  loading: boolean
  isError: boolean
}

/**
 * Charge le détail d'un déploiement via React Query (seam display-only →
 * `GET /deployments/{id}` au branchement). Désactivée tant que l'`id` est absent
 * (param de route non résolu).
 */
export function useDeployment(id: string | undefined): UseDeploymentResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: deploymentQueryKey(id ?? ''),
    queryFn: () => getDeployment(id as string),
    enabled: Boolean(id),
  })

  return {
    deployment: data,
    loading: isLoading,
    isError,
  }
}
