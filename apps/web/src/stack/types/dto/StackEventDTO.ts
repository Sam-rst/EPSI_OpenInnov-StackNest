/**
 * Miroir d'une trame SSE du flux `GET /stacks/{id}/events` (lot 3, worker — en
 * cours de développement en parallèle). Aligné sur l'esprit du flux déploiement
 * (`DeploymentEventDTO`) étendu à deux niveaux (stack + service).
 *
 * Chaque trame porte le nouveau `status` **global** de la stack, et
 * optionnellement le `service_status` d'un service identifié (`alias`) avec un
 * `message` de progression. Invariant de sécurité (cf. design § Sécurité) :
 * aucun secret n'y figure (les `var_mappings` sont résolues worker-side).
 *
 * Contrat susceptible d'ajustement à la livraison du lot 3 : le hook reste
 * défensif (champs optionnels) et **dégrade proprement** si l'endpoint manque.
 */
export interface StackEventDTO {
  /** Nouveau statut global de la stack (valeur brute de `stack_status`). */
  status: string
  /** Alias du service concerné par la trame, si elle cible un service. */
  alias?: string | null
  /** Nouveau statut du service ciblé (valeur brute de `service_status`). */
  service_status?: string | null
  /** Libellé humain de progression / d'échec, ou `null`. */
  message?: string | null
}
