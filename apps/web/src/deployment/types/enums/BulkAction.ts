/**
 * Action groupée applicable à une sélection de déploiements.
 *
 * Mappées sur les endpoints unitaires existants (pas d'endpoint bulk côté back) :
 *   - `STOP`   → `POST /deployments/{id}/stop`    (arrête les running)
 *   - `START`  → `POST /deployments/{id}/start`   (redémarre les stopped)
 *   - `DELETE` → `POST /deployments/{id}/destroy` (détruit, irréversible)
 *
 * Il n'existe pas d'opération « pause » distincte côté back : la machine à états
 * ne connaît que `running ⇄ stopped`. La pause se confond donc avec l'arrêt et
 * n'est pas exposée comme action séparée (doublon de `STOP`).
 */
export const BulkAction = {
  STOP: 'stop',
  START: 'start',
  DELETE: 'delete',
} as const

export type BulkAction = (typeof BulkAction)[keyof typeof BulkAction]
