import { useMutation } from '@tanstack/react-query'

import { rejectAction } from '../services/chatService'

export interface UseRejectActionResult {
  /** Rejette une action proposée (`POST /chat/actions/{id}/reject`). */
  reject: (actionId: string) => Promise<void>
  rejecting: boolean
}

/**
 * Mutation de rejet d'une action proposée (seam display-only). Le rejet est une
 * décision locale honnête : aucune ressource n'est créée tant que l'utilisateur
 * n'a pas confirmé.
 */
export function useRejectAction(): UseRejectActionResult {
  const mutation = useMutation({
    mutationFn: (actionId: string) => rejectAction(actionId),
  })

  return {
    reject: (actionId) => mutation.mutateAsync(actionId),
    rejecting: mutation.isPending,
  }
}
