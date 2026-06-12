import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import { deleteStack } from '../services/stackService'
import { STACKS_QUERY_KEY } from './useStacks'

export type UseBulkDeleteStacksResult = UseMutationResult<void, Error, readonly string[]>

/**
 * Destruction en masse des stacks sélectionnées : enfile un `DELETE /stacks/{id}`
 * par identifiant (la destruction réelle des conteneurs/volumes est asynchrone,
 * gérée par le worker). Au succès, invalide la liste pour rafraîchir l'UI.
 */
export function useBulkDeleteStacks(): UseBulkDeleteStacksResult {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: readonly string[]): Promise<void> => {
      await Promise.all(ids.map((id) => deleteStack(id)))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STACKS_QUERY_KEY })
    },
  })
}
