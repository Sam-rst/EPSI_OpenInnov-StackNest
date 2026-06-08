import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createConversation,
  deleteConversation,
  listConversations,
  renameConversation,
} from '../services/chatService'
import type { Conversation } from '../types/models/Conversation'
import { CHAT_QUERY_KEYS } from './chatQueryKeys'

export interface UseConversationsResult {
  conversations: readonly Conversation[]
  loading: boolean
  isError: boolean
  /** Crée un fil puis rafraîchit la liste. */
  create: (title: string) => Promise<Conversation>
  /** Renomme un fil puis rafraîchit la liste. */
  rename: (id: string, title: string) => Promise<Conversation>
  /** Supprime un fil puis rafraîchit la liste. */
  remove: (id: string) => Promise<void>
}

/**
 * Charge et pilote les fils de discussion via React Query (seam display-only →
 * `GET/POST/PATCH/DELETE /chat/conversations`). Chaque mutation invalide la liste
 * pour resynchroniser la sidebar.
 */
export function useConversations(): UseConversationsResult {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: CHAT_QUERY_KEYS.conversations,
    queryFn: () => listConversations(),
  })

  const invalidate = (): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations })

  const createMutation = useMutation({
    mutationFn: (title: string) => createConversation(title),
    onSuccess: invalidate,
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameConversation(id, title),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: invalidate,
  })

  return {
    conversations: data ?? [],
    loading: isLoading,
    isError,
    create: (title) => createMutation.mutateAsync(title),
    rename: (id, title) => renameMutation.mutateAsync({ id, title }),
    remove: (id) => removeMutation.mutateAsync(id),
  }
}
