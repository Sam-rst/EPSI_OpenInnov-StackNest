import { useMutation } from '@tanstack/react-query'

import { sendMessage } from '../services/chatService'

export interface UseSendMessageResult {
  /** Envoie un message utilisateur (`POST /chat/conversations/{id}/messages` → 202). */
  send: (conversationId: string, content: string) => Promise<void>
  sending: boolean
}

/**
 * Mutation d'envoi d'un message utilisateur (`POST .../messages` → 202). Le back
 * traite le message de façon asynchrone : la réponse de l'assistant (tokens,
 * message, action) arrive par le flux SSE piloté par `useChatStream`. Cette
 * mutation ne couvre que l'acceptation du tour utilisateur, sans corps de réponse.
 */
export function useSendMessage(): UseSendMessageResult {
  const mutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      sendMessage(conversationId, content),
  })

  return {
    send: (conversationId, content) => mutation.mutateAsync({ conversationId, content }),
    sending: mutation.isPending,
  }
}
