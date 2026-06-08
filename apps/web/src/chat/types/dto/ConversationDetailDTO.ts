import type { ConversationDTO } from './ConversationDTO'
import type { MessageDTO } from './MessageDTO'

/**
 * Miroir EXACT du détail d'un fil renvoyé par `GET /chat/conversations/{id}`
 * (`ConversationDetailResponse` côté back) : le fil et la liste de ses messages
 * d'amorce. Le tour de conversation live (tokens, action) arrive ensuite par SSE.
 */
export interface ConversationDetailDTO {
  conversation: ConversationDTO
  messages: readonly MessageDTO[]
}
