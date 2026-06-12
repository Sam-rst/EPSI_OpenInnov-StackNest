import { availableActions } from '../detail/lifecycleAvailability'
import type { DeploymentStatus } from '../../types/enums/DeploymentStatus'

/** Actions groupées proposées pour un ensemble de déploiements sélectionnés. */
export interface BulkActionAvailability {
  canStart: boolean
  canStop: boolean
  canDestroy: boolean
}

/**
 * Actions groupées applicables « au mieux » à une sélection : une action est
 * proposée dès qu'au moins un déploiement sélectionné l'autorise (cf.
 * `availableActions` par déploiement). L'exécution filtrera ensuite les items
 * réellement éligibles. La régénération du mot de passe n'est pas exposée en
 * masse (action unitaire, sans sens groupé).
 */
export function bulkActionAvailability(
  statuses: readonly DeploymentStatus[],
): BulkActionAvailability {
  return statuses.reduce<BulkActionAvailability>(
    (accumulator, status) => {
      const allowed = availableActions(status)
      return {
        canStart: accumulator.canStart || allowed.canStart,
        canStop: accumulator.canStop || allowed.canStop,
        canDestroy: accumulator.canDestroy || allowed.canDestroy,
      }
    },
    { canStart: false, canStop: false, canDestroy: false },
  )
}
