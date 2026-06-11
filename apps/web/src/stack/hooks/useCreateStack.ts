import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import { createStack, type CreateStackResult } from '../services/stackService'
import type { StackWriteDTO } from '../types/dto/StackWriteDTO'
import { STACKS_QUERY_KEY } from './useStacks'

export type UseCreateStackResult = UseMutationResult<CreateStackResult, Error, StackWriteDTO>

/**
 * Mutation de création d'une stack (`POST /stacks`). Au succès, invalide la
 * liste des stacks pour qu'elle se rafraîchisse. L'appelant utilise l'`id`
 * renvoyé pour rediriger vers `/stacks/{id}`.
 */
export function useCreateStack(): UseCreateStackResult {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StackWriteDTO) => createStack(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STACKS_QUERY_KEY })
    },
  })
}
