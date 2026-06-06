import type { ChatMessage } from '../domain/models/ChatMessage'
import type { Conversation } from '../domain/models/Conversation'

/**
 * Seam d'accès au ChatOps (contract-first).
 *
 * Display-only (vague 1) : aucune donnée n'est fabriquée, aucun appel LLM
 * n'est émis. Les conversations et messages restent vides → la page rend ses
 * états vides honnêtes.
 *
 * Vague 2 (backend ChatOps) : ces fonctions basculeront sur les appels API
 *   (`GET /chat/conversations`, `GET /chat/conversations/:id/messages`,
 *   `POST /chat/conversations/:id/messages`) + mappers DTO → modèle, sans
 *   changer leur signature — la page, le hook et les composants restent
 *   inchangés.
 */
export function listConversations(): Promise<readonly Conversation[]> {
  return Promise.resolve([])
}

export function listMessages(conversationId: string): Promise<readonly ChatMessage[]> {
  // Le paramètre fait partie du contrat à venir (`GET …/:id/messages`) ; il est
  // intentionnellement inexploité tant que le backend n'est pas branché.
  void conversationId
  return Promise.resolve([])
}

/**
 * Envoie un message dans une conversation. Tant que le backend n'est pas
 * branché, aucun message n'est persisté ni aucune réponse d'IA produite :
 * la fonction résout la liste de messages inchangée (vide).
 */
export function sendMessage(conversationId: string, text: string): Promise<readonly ChatMessage[]> {
  // Paramètres du contrat à venir (`POST …/:id/messages`), inexploités en
  // display-only : aucun envoi réel ni appel LLM.
  void conversationId
  void text
  return Promise.resolve([])
}
