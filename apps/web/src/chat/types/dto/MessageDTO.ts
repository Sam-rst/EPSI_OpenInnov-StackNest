/**
 * Miroir EXACT d'un message d'un fil de discussion, tel que renvoyé par
 * `GET /chat/conversations/{id}` (`MessageResponse` côté back).
 *
 * `role` est une valeur brute (`user` / `assistant` / `tool`), normalisée en enum
 * par le mapper. L'API REST ne porte PAS la proposition d'action sur le message :
 * une action proposée arrive uniquement par l'événement SSE `action_proposed`.
 */
export interface MessageDTO {
  id: string
  /** Rôle brut de l'auteur (`user` / `assistant` / `tool`). */
  role: string
  /** Contenu textuel (langage naturel, jamais d'HTML). */
  content: string
  /** Date d'envoi ISO 8601, ou `null`. */
  created_at: string | null
}
