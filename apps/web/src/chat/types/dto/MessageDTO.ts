import type { ActionProposedEventDTO } from './ChatStreamEventDTO'

/**
 * Récap PUBLIC d'une proposition encore `proposed` rattachée à son message
 * d'amorce (`MessageActionResponse` côté back). Forme IDENTIQUE au payload de
 * l'événement SSE `action_proposed` (`{action_id, kind, restatement, recap}`) :
 * le mapper la reconstruit avec la même logique (`mapActionProposed`). AUCUN
 * secret n'y transite (le `recap` reprend les `args` validés, déjà masqués).
 */
export type MessageActionDTO = ActionProposedEventDTO

/**
 * Miroir EXACT d'un message d'un fil de discussion, tel que renvoyé par
 * `GET /chat/conversations/{id}` (`MessageResponse` côté back).
 *
 * `role` est une valeur brute (`user` / `assistant` / `tool`), normalisée en enum
 * par le mapper. Un message assistant PEUT porter une proposition d'action encore
 * `proposed` (`action`), afin que le front rejoue la carte de confirmation au
 * rechargement du fil. Pendant un tour live, la proposition arrive plutôt par
 * l'événement SSE `action_proposed`.
 */
export interface MessageDTO {
  id: string
  /** Rôle brut de l'auteur (`user` / `assistant` / `tool`). */
  role: string
  /** Contenu textuel (langage naturel, jamais d'HTML). */
  content: string
  /** Date d'envoi ISO 8601, ou `null`. */
  created_at: string | null
  /** Proposition d'action encore `proposed` rattachée, ou absente. */
  action?: MessageActionDTO | null
}
