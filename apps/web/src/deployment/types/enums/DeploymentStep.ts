/**
 * Étapes du stepper Docker (suivi de progression d'un déploiement conteneur).
 *
 * Adapté du stepper générique du mockup à la réalité Docker (§5 spec front) :
 * Validation → Pull image → Création conteneur → Démarrage → Prêt.
 *
 * Purement présentationnel : pilote l'affichage du stepper, indépendant de la
 * machine à états métier (`DeploymentStatus`).
 */
export const DeploymentStep = {
  VALIDATION: 'validation',
  PULL_IMAGE: 'pull_image',
  CREATE_CONTAINER: 'create_container',
  START: 'start',
  READY: 'ready',
} as const

export type DeploymentStep = (typeof DeploymentStep)[keyof typeof DeploymentStep]

/** Libellés français affichés sous chaque cercle du stepper. */
export const DEPLOYMENT_STEP_LABELS: Record<DeploymentStep, string> = {
  validation: 'Validation',
  pull_image: 'Pull image',
  create_container: 'Création conteneur',
  start: 'Démarrage',
  ready: 'Prêt',
}

/** Ordre canonique des étapes du stepper Docker. */
export const DEPLOYMENT_STEPS: readonly DeploymentStep[] = [
  DeploymentStep.VALIDATION,
  DeploymentStep.PULL_IMAGE,
  DeploymentStep.CREATE_CONTAINER,
  DeploymentStep.START,
  DeploymentStep.READY,
]
