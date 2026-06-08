import type { ActionProposalDTO } from './ActionProposalDTO'

/**
 * Miroir EXACT d'un message d'un fil de discussion
 * (`GET /chat/conversations/{id}`, `POST /chat/conversations/{id}/messages`).
 *
 * `role` est une valeur brute (`user` / `assistant` / `tool`), normalisée en
 * enum par le mapper. Un message assistant peut porter une `action` (proposition
 * de confirmation avancée) ; les autres en sont dépourvus (`null`).
 */
export interface MessageDTO {
  id: string
  /** Rôle brut de l'auteur (`user` / `assistant` / `tool`). */
  role: string
  /** Contenu textuel (langage naturel, jamais d'HTML). */
  content: string
  /** Date d'envoi ISO 8601. */
  created_at: string
  /** Proposition d'action attachée (confirmation avancée), ou `null`. */
  action: ActionProposalDTO | null
}
