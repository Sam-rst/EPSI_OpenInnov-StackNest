import { useMutation } from '@tanstack/react-query'

import { confirmAction } from '../services/chatService'

export interface UseConfirmActionResult {
  /** Confirme une action proposée (`POST /chat/actions/{id}/confirm`). */
  confirm: (actionId: string) => Promise<void>
  confirming: boolean
}

/**
 * Mutation de confirmation d'une action proposée (seam display-only). Le
 * résultat d'exécution (statut, déploiement créé) revient ensuite par le flux
 * SSE (`action_result`), réduit par `useChatStream`.
 */
export function useConfirmAction(): UseConfirmActionResult {
  const mutation = useMutation({
    mutationFn: (actionId: string) => confirmAction(actionId),
  })

  return {
    confirm: (actionId) => mutation.mutateAsync(actionId),
    confirming: mutation.isPending,
  }
}
