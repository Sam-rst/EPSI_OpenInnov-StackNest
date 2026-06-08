import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { DeploymentStep } from '../../types/enums/DeploymentStep'

/**
 * Décision d'affichage du stepper de provisioning selon le statut courant (#15).
 * Le stepper ne décrit QUE la phase de provisioning (pending → … → running) : il
 * ne doit pas tourner sur « Validation » dans des états qui n'en relèvent pas.
 */
export interface StepperView {
  /** Affiche le stepper (provisioning en cours, prêt, ou échec figé). */
  show: boolean
  /** L'étape figée par l'échec (bandeaux rouges au lieu d'un spinner). */
  failed: boolean
  /** Étape de référence déduite du statut (la page peut affiner en provisioning). */
  currentStep: DeploymentStep
}

/**
 * Déduit l'état du stepper d'un statut :
 * - `pending`/`provisioning` : stepper actif (validation → pull image…).
 * - `running` : stepper complété sur « Prêt » (aucun spinner trompeur).
 * - `failed` : stepper figé, marqué en échec (rouge).
 * - `stopped`/`destroying`/`destroyed` : cycle de vie, pas de provisioning →
 *   stepper masqué (l'état est porté par le badge de statut et les logs).
 */
export function stepperViewForStatus(status: DeploymentStatus): StepperView {
  switch (status) {
    case DeploymentStatus.PENDING:
      return { show: true, failed: false, currentStep: DeploymentStep.VALIDATION }
    case DeploymentStatus.PROVISIONING:
      return { show: true, failed: false, currentStep: DeploymentStep.PULL_IMAGE }
    case DeploymentStatus.RUNNING:
      return { show: true, failed: false, currentStep: DeploymentStep.READY }
    case DeploymentStatus.FAILED:
      return { show: true, failed: true, currentStep: DeploymentStep.VALIDATION }
    default:
      return { show: false, failed: false, currentStep: DeploymentStep.VALIDATION }
  }
}
