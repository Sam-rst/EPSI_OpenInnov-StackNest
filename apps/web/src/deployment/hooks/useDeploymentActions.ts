import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import {
  destroyDeployment,
  regenerateDeploymentPassword,
  startDeployment,
  stopDeployment,
} from '../services/deploymentService'
import { deploymentQueryKey } from './useDeployment'
import { DEPLOYMENTS_QUERY_KEY } from './useDeployments'

type DeploymentMutation = UseMutationResult<void, Error, void>

interface UseDeploymentActionsResult {
  stop: DeploymentMutation
  start: DeploymentMutation
  destroy: DeploymentMutation
  regeneratePassword: DeploymentMutation
}

/**
 * Mutations de cycle de vie d'un déploiement (stubs display-only : stop / start /
 * destroy / regenerate-password). Chaque succès invalide le détail + la liste
 * pour rafraîchir l'UI — comportement conservé au branchement API réel.
 */
export function useDeploymentActions(id: string): UseDeploymentActionsResult {
  const queryClient = useQueryClient()

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: deploymentQueryKey(id) })
    await queryClient.invalidateQueries({ queryKey: DEPLOYMENTS_QUERY_KEY })
  }

  const stop = useMutation({ mutationFn: () => stopDeployment(id), onSuccess: invalidate })
  const start = useMutation({ mutationFn: () => startDeployment(id), onSuccess: invalidate })
  const destroy = useMutation({ mutationFn: () => destroyDeployment(id), onSuccess: invalidate })
  const regeneratePassword = useMutation({
    mutationFn: () => regenerateDeploymentPassword(id),
    onSuccess: invalidate,
  })

  return { stop, start, destroy, regeneratePassword }
}
