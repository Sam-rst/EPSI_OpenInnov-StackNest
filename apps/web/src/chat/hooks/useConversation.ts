import { useQuery } from '@tanstack/react-query'

import { getConversationMessages } from '../services/chatService'
import type { Message } from '../types/models/Message'
import { CHAT_QUERY_KEYS } from './chatQueryKeys'

export interface UseConversationResult {
  /** Messages d'amorce du fil (avant tout échange live du tour courant). */
  seedMessages: readonly Message[]
  loading: boolean
  isError: boolean
}

/**
 * Charge les messages d'amorce d'un fil via React Query (seam display-only →
 * `GET /chat/conversations/{id}`). Le tour de conversation live (envoi + flux
 * SSE) est piloté séparément par `useChatStream`.
 */
export function useConversation(conversationId: string): UseConversationResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: CHAT_QUERY_KEYS.conversationMessages(conversationId),
    queryFn: () => getConversationMessages(conversationId),
  })

  return {
    seedMessages: data ?? [],
    loading: isLoading,
    isError,
  }
}
