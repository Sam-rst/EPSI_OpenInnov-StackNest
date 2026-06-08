import type { DeploymentStatus } from '../enums/DeploymentStatus'

/** Niveau d'une ligne de log streamée (modèle UI). */
export type DeploymentLogLevel = 'info' | 'ok' | 'err'

/** Ligne de log enrichie pour l'affichage de la console live. */
export interface DeploymentLog {
  time: string
  level: DeploymentLogLevel
  message: string
}

/** Accès à la ressource (modèle UI), affiché une seule fois au passage « running ». */
export interface DeploymentAccess {
  host: string
  port: number
  user: string
  password: string
}

/**
 * Event de déploiement enrichi pour l'UI (issu du flux SSE — simulé en
 * display-only). Met à jour le statut, append un log, ou livre les accès.
 */
export interface DeploymentEvent {
  at: string
  status?: DeploymentStatus
  log?: DeploymentLog
  access?: DeploymentAccess
}
