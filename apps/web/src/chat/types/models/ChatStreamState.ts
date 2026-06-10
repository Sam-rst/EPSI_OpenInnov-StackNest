/**
 * Contrat d'état riche du tour de conversation, exposé par `useChatStream` et
 * consommé par les composants du chat (cf. spec UX 2026-06-10). La machine d'état
 * remplace l'ancien booléen `isStreaming` par un statut explicite, et l'erreur
 * plate (`string`) par une erreur typée par catégorie — afin d'afficher un
 * feedback contextualisé (réseau / timeout / métier / auth) plutôt qu'un bandeau
 * générique.
 */

/**
 * Phase du tour de conversation en cours.
 *   - `idle`      → aucun tour en cours (état initial / après `done`/`error`).
 *   - `thinking`  → message envoyé, l'assistant réfléchit (avant le 1er token).
 *   - `streaming` → les tokens arrivent (la bulle se remplit).
 *   - `done`      → le message final est figé ; retour au repos logique.
 *   - `error`     → le tour a échoué (voir `error.kind` pour la catégorie).
 */
export type ChatStreamStatus = 'idle' | 'thinking' | 'streaming' | 'done' | 'error'

/**
 * Catégorie d'erreur du tour, qui pilote le message et le visuel affichés :
 *   - `network`  → coupure réseau / SSE non récupérable après retries.
 *   - `timeout`  → lenteur / délai dépassé côté LLM.
 *   - `business` → erreur métier honnête remontée par le back (`event: error`).
 *   - `auth`     → 401 non récupérable (refresh épuisé).
 *   - `unknown`  → cause indéterminée (filet de sécurité).
 */
export type ChatErrorKind = 'network' | 'timeout' | 'business' | 'auth' | 'unknown'

/** Erreur du tour de conversation : catégorie typée + message honnête à afficher. */
export interface ChatStreamError {
  kind: ChatErrorKind
  message: string
}

/**
 * État riche du tour de conversation. `streamingText` accumule les tokens de la
 * réponse assistant en cours ; `isReconnecting` signale une tentative de
 * reconnexion SSE en cours (avant de basculer en `error`).
 */
export interface ChatStreamState {
  status: ChatStreamStatus
  /** Texte assistant en cours d'accumulation (buffer de tokens). */
  streamingText: string
  /** Erreur typée du tour, ou `null` si aucun échec. */
  error: ChatStreamError | null
  /** Une reconnexion SSE est en cours (pastille « reconnexion »). */
  isReconnecting: boolean
}
