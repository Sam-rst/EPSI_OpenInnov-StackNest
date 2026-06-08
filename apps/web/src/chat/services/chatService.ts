import { buildConversationFixtures } from '../data/conversations.fixtures'
import { seedMessagesFor } from '../data/messages.fixtures'
import { mapConversationDto, mapMessageDto } from '../mappers/chatMapper'
import type { ConversationDTO } from '../types/dto/ConversationDTO'
import type { MessageDTO } from '../types/dto/MessageDTO'
import type { Conversation } from '../types/models/Conversation'
import type { Message } from '../types/models/Message'

/**
 * Service de la feature Chat IA — SEAM display-only (fixtures). Les composants
 * consomment des modèles via ce service ; aucun appel réseau n'est encore émis.
 * Au branchement, chaque fonction remplacera ses fixtures par un appel
 * `apiClient` mappé, sans changer sa signature (même contrat côté hooks/UI).
 *
 * Endpoints REST réels visés (contrat back à figer) :
 *   - `GET    /chat/conversations`                  → listConversations()
 *   - `POST   /chat/conversations`                  → createConversation(title)
 *   - `GET    /chat/conversations/{id}`             → getConversationMessages(id)
 *   - `PATCH  /chat/conversations/{id}`             → renameConversation(id, title)
 *   - `DELETE /chat/conversations/{id}`             → deleteConversation(id)
 *   - `POST   /chat/conversations/{id}/messages`    → sendMessage(id, content)
 *   - `POST   /chat/actions/{id}/confirm`           → confirmAction(id)
 *   - `POST   /chat/actions/{id}/reject`            → rejectAction(id)
 *
 * Le flux SSE `GET /chat/conversations/{id}/stream` est piloté par le hook
 * `useChatStream` (fetch-SSE + Bearer), alimenté ici par des trames scriptées.
 */

/** Latence simulée (ms) pour rendre les états de chargement visibles en démo. */
const SIMULATED_LATENCY_MS = 200

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), SIMULATED_LATENCY_MS)
  })
}

/** Liste les fils de l'utilisateur (`GET /chat/conversations`). */
export async function listConversations(): Promise<readonly Conversation[]> {
  const dtos = await delay<readonly ConversationDTO[]>(buildConversationFixtures())
  return dtos.map(mapConversationDto)
}

/** Récupère les messages d'un fil (`GET /chat/conversations/{id}`). */
export async function getConversationMessages(id: string): Promise<readonly Message[]> {
  const dtos = await delay<readonly MessageDTO[]>(seedMessagesFor(id))
  return dtos.map(mapMessageDto)
}

/** Crée un fil (`POST /chat/conversations`) et renvoie son modèle. */
export async function createConversation(title: string): Promise<Conversation> {
  const dto: ConversationDTO = {
    id: `c-${crypto.randomUUID()}`,
    title,
    created_at: new Date().toISOString(),
    updated_at: null,
  }
  return mapConversationDto(await delay(dto))
}

/** Renomme un fil (`PATCH /chat/conversations/{id}`) et renvoie son modèle. */
export async function renameConversation(id: string, title: string): Promise<Conversation> {
  const dto: ConversationDTO = {
    id,
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  return mapConversationDto(await delay(dto))
}

/** Supprime un fil (`DELETE /chat/conversations/{id}`). */
export async function deleteConversation(id: string): Promise<void> {
  void id
  await delay(undefined)
}

/** Envoie un message utilisateur (`POST /chat/conversations/{id}/messages`). */
export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  void conversationId
  const dto: MessageDTO = {
    id: `m-${crypto.randomUUID()}`,
    role: 'user',
    content,
    created_at: new Date().toISOString(),
    action: null,
  }
  return mapMessageDto(await delay(dto))
}

/** Confirme une action proposée (`POST /chat/actions/{id}/confirm`). */
export async function confirmAction(actionId: string): Promise<void> {
  void actionId
  await delay(undefined)
}

/** Rejette une action proposée (`POST /chat/actions/{id}/reject`). */
export async function rejectAction(actionId: string): Promise<void> {
  void actionId
  await delay(undefined)
}
