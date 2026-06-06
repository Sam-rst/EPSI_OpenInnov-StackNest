/**
 * Conversation ChatOps listée dans la barre latérale.
 *
 * Mirror UI du contrat ChatOps à venir : la liste reste vide tant que le
 * backend (persistance des conversations) n'est pas branché via le seam
 * `chatService`. Aucune conversation n'est fabriquée côté front.
 */
export interface Conversation {
  /** Identifiant stable de la conversation. */
  id: string
  /** Titre court résumant le besoin (ex. « Env de dev Node + Postgres »). */
  title: string
  /** Libellé d'horodatage relatif (ex. « il y a 2 h »). */
  updatedLabel: string
}
