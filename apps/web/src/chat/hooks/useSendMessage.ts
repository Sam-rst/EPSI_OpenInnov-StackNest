import { useMutation } from '@tanstack/react-query'

import { sendMessage } from '../services/chatService'
import type { Message } from '../types/models/Message'

export interface UseSendMessageResult {
  /** Persiste un message utilisateur (`POST /chat/conversations/{id}/messages`). */
  send: (conversationId: string, content: string) => Promise<Message>
  sending: boolean
}

/**
 * Mutation d'envoi d'un message utilisateur (seam display-only). La réponse de
 * l'assistant (tokens, message, action) arrive par le flux SSE piloté par
 * `useChatStream` — cette mutation ne couvre que la persistance du tour user.
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
