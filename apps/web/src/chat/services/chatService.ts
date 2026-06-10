import { apiClient } from '../../core/api/apiClient'
import { mapConversationDto, mapMessageDto } from '../mappers/chatMapper'
import type { ConversationDetailDTO } from '../types/dto/ConversationDetailDTO'
import type { ConversationDTO } from '../types/dto/ConversationDTO'
import type { Conversation } from '../types/models/Conversation'
import type { Message } from '../types/models/Message'

/**
 * Service de la feature Chat IA, branché sur l'API REST `/chat`.
 *
 * Pattern identique au déploiement : les composants consomment des modèles via ce
 * service, qui appelle `apiClient` (Bearer + refresh gérés par l'intercepteur) et
 * mappe les réponses. Le contenu provient toujours de l'API — aucune fixture.
 *
 *   - `GET    /chat/conversations`               → listConversations()
 *   - `POST   /chat/conversations`               → createConversation(title)
 *   - `GET    /chat/conversations/{id}`          → getConversationMessages(id)
 *   - `PATCH  /chat/conversations/{id}`          → renameConversation(id, title)
 *   - `DELETE /chat/conversations/{id}`          → deleteConversation(id)
 *   - `POST   /chat/conversations/{id}/messages` → sendMessage(id, content) (202)
 *   - `POST   /chat/actions/{id}/confirm`        → confirmAction(id) (202)
 *   - `POST   /chat/actions/{id}/reject`         → rejectAction(id) (202)
 *
 * La réponse de l'assistant (tokens, message, action proposée/résultat) n'arrive
 * jamais en REST : elle est poussée sur le flux SSE
 * `GET /chat/conversations/{id}/stream`, piloté par `useChatStream`.
 */

const CONVERSATIONS_PATH = '/chat/conversations'
const ACTIONS_PATH = '/chat/actions'

/** Corps de renommage / création (titre du fil). */
interface TitleBody {
  title: string
}

/** Liste les fils de l'utilisateur authentifié (`GET /chat/conversations`). */
export async function listConversations(): Promise<readonly Conversation[]> {
  const { data } = await apiClient.get<ConversationDTO[]>(CONVERSATIONS_PATH)
  return data.map(mapConversationDto)
}

/** Récupère les messages d'amorce d'un fil (`GET /chat/conversations/{id}`). */
export async function getConversationMessages(id: string): Promise<readonly Message[]> {
  const { data } = await apiClient.get<ConversationDetailDTO>(`${CONVERSATIONS_PATH}/${id}`)
  return data.messages.map(mapMessageDto)
}

/** Crée un fil (`POST /chat/conversations` → 201) et renvoie son modèle. */
export async function createConversation(title: string): Promise<Conversation> {
  const body: TitleBody = { title }
  const { data } = await apiClient.post<ConversationDTO>(CONVERSATIONS_PATH, body)
  return mapConversationDto(data)
}

/** Renomme un fil (`PATCH /chat/conversations/{id}`) et renvoie son modèle. */
export async function renameConversation(id: string, title: string): Promise<Conversation> {
  const body: TitleBody = { title }
  const { data } = await apiClient.patch<ConversationDTO>(`${CONVERSATIONS_PATH}/${id}`, body)
  return mapConversationDto(data)
}

/** Supprime un fil (`DELETE /chat/conversations/{id}` → 204). */
export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`${CONVERSATIONS_PATH}/${id}`)
}

/**
 * Envoie un message utilisateur (`POST /chat/conversations/{id}/messages` → 202).
 * Le traitement est asynchrone : la réponse de l'assistant arrive ensuite par le
 * flux SSE de la conversation, déjà ouvert côté `useChatStream`.
 */
export async function sendMessage(conversationId: string, content: string): Promise<void> {
  await apiClient.post(`${CONVERSATIONS_PATH}/${conversationId}/messages`, { content })
}

/** Confirme une action proposée (`POST /chat/actions/{id}/confirm` → 202). */
export async function confirmAction(actionId: string): Promise<void> {
  await apiClient.post(`${ACTIONS_PATH}/${actionId}/confirm`)
}

/** Rejette une action proposée (`POST /chat/actions/{id}/reject` → 202). */
export async function rejectAction(actionId: string): Promise<void> {
  await apiClient.post(`${ACTIONS_PATH}/${actionId}/reject`)
}
