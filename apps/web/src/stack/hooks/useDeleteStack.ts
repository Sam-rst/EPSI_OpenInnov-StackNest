import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import { deleteStack } from '../services/stackService'
import { stackQueryKey } from './useStack'
import { STACKS_QUERY_KEY } from './useStacks'

export type UseDeleteStackResult = UseMutationResult<void, Error, void>

/**
 * Mutation de destruction d'une stack (`DELETE /stacks/{id}`). Au succès,
 * invalide le détail + la liste pour rafraîchir l'UI (la destruction réelle des
 * conteneurs/volumes arrive au lot 3 worker).
 */
export function useDeleteStack(id: string): UseDeleteStackResult {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteStack(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stackQueryKey(id) })
      await queryClient.invalidateQueries({ queryKey: STACKS_QUERY_KEY })
    },
  })
}
