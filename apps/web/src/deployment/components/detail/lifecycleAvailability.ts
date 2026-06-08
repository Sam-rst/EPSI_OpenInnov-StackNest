import { DeploymentStatus } from '../../types/enums/DeploymentStatus'

/** Actions de cycle de vie possibles depuis un statut donné. */
export interface AvailableActions {
  canStart: boolean
  canStop: boolean
  canRegenerate: boolean
  canDestroy: boolean
}

/**
 * Détermine les actions disponibles selon le statut (cf. machine à états back).
 * - `running`   : arrêter, régénérer le mot de passe, détruire.
 * - `stopped`   : démarrer, détruire.
 * - transitoires (pending/provisioning/destroying) : aucune action.
 * - terminaux (failed/destroyed) : détruire seulement si non encore détruit.
 */
export function availableActions(status: DeploymentStatus): AvailableActions {
  switch (status) {
    case DeploymentStatus.RUNNING:
      return { canStart: false, canStop: true, canRegenerate: true, canDestroy: true }
    case DeploymentStatus.STOPPED:
      return { canStart: true, canStop: false, canRegenerate: false, canDestroy: true }
    case DeploymentStatus.FAILED:
      return { canStart: false, canStop: false, canRegenerate: false, canDestroy: true }
    default:
      return { canStart: false, canStop: false, canRegenerate: false, canDestroy: false }
  }
}
