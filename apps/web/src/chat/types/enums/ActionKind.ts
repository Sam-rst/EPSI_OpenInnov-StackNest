/**
 * Nature de l'action proposée par l'assistant (confirmation avancée).
 * `deploy` provisionne une nouvelle ressource ; `stop` / `start` pilotent un
 * déploiement existant ; `regenerate` régénère le mot de passe d'accès.
 * Aligné sur les actions de cycle de vie de la slice déploiement.
 */
export const ActionKind = {
  DEPLOY: 'deploy',
  STOP: 'stop',
  START: 'start',
  REGENERATE: 'regenerate',
} as const

export type ActionKind = (typeof ActionKind)[keyof typeof ActionKind]

/** Libellés français des actions, affichés dans la carte de confirmation. */
export const ACTION_KIND_LABELS: Record<ActionKind, string> = {
  deploy: 'Déployer',
  stop: 'Arrêter',
  start: 'Démarrer',
  regenerate: 'Régénérer le mot de passe',
}
