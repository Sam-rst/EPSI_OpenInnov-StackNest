/**
 * Miroir EXACT d'un fil de discussion renvoyé par l'API
 * (`GET /chat/conversations`, `GET /chat/conversations/{id}`).
 *
 * Le contrat back n'est pas encore figé : ce DTO reflète le strict nécessaire au
 * MVP (identité du fil, titre, horodatages ISO 8601). Tout enrichissement UI
 * (libellé relatif « il y a 2 h ») se fait côté modèle via le mapper.
 */
export interface ConversationDTO {
  id: string
  title: string
  /** Date de création ISO 8601. */
  created_at: string
  /** Date du dernier message ISO 8601, ou `null` si le fil est vide. */
  updated_at: string | null
}
