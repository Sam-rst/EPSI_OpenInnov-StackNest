/**
 * Fil de discussion enrichi pour l'UI. Consommé par la sidebar : les composants
 * reçoivent ce modèle, jamais le DTO. `relativeWhen` est un libellé relatif
 * pré-calculé (« à l'instant », « il y a 2 h ») dérivé de `updatedAt`.
 */
export interface Conversation {
  id: string
  title: string
  /** Date de création ISO 8601, ou `null`. */
  createdAt: string | null
  /** Date du dernier message ISO 8601, ou `null` si le fil est vide. */
  updatedAt: string | null
  /** Libellé relatif affiché sous le titre (ex. « il y a 2 h »). */
  relativeWhen: string
}
