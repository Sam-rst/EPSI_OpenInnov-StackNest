import { useCallback, useEffect, useState } from 'react'

import type { ChatMessage } from '../domain/models/ChatMessage'
import type { Conversation } from '../domain/models/Conversation'
import { listConversations, listMessages, sendMessage } from '../services/chatService'

interface UseChatResult {
  conversations: readonly Conversation[]
  messages: readonly ChatMessage[]
  activeConversationId: string | null
  loading: boolean
  selectConversation: (id: string) => void
  send: (text: string) => Promise<void>
}

/**
 * Orchestration display-only du ChatOps via le seam `chatService`.
 *
 * Vague 1 : conversations et messages restent vides (aucune donnée fabriquée,
 *   aucun appel LLM). La page rend ses états vides honnêtes.
 * Vague 2 : le branchement de l'API passera par le même seam, sans changer
 *   ce hook ni les composants.
 */
export function useChat(): UseChatResult {
  const [conversations, setConversations] = useState<readonly Conversation[]>([])
  const [messages, setMessages] = useState<readonly ChatMessage[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    void listConversations().then((data) => {
      if (active) {
        setConversations(data)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    void listMessages(id).then(setMessages)
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const updated = await sendMessage(activeConversationId ?? '', trimmed)
      setMessages(updated)
    },
    [activeConversationId],
  )

  return {
    conversations,
    messages,
    activeConversationId,
    loading,
    selectConversation,
    send,
  }
}
