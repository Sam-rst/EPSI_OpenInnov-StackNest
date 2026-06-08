/** Clés React Query de la feature Chat IA (centralisées pour l'invalidation). */
export const CHAT_QUERY_KEYS = {
  conversations: ['chat', 'conversations'] as const,
  conversationMessages: (id: string) => ['chat', 'conversations', id, 'messages'] as const,
}
