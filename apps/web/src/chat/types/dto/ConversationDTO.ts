/**
 * Miroir EXACT d'un fil de discussion renvoyé par l'API
 * (`GET /chat/conversations`, `POST /chat/conversations`, `PATCH …`).
 *
 * Reflète `ConversationResponse` (back) : identité du fil, titre, horodatages ISO
 * 8601 (`created_at` / `updated_at` peuvent être `null`). Tout enrichissement UI
 * (libellé relatif « il y a 2 h ») se fait côté modèle via le mapper.
 */
export interface ConversationDTO {
  id: string
  title: string
  /** Date de création ISO 8601, ou `null`. */
  created_at: string | null
  /** Date du dernier message ISO 8601, ou `null` si le fil est vide. */
  updated_at: string | null
}
