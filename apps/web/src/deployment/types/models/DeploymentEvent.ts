import type { DeploymentStatus } from '../enums/DeploymentStatus'

/** Niveau d'une ligne de log dérivée d'un event SSE (modèle UI). */
export type DeploymentLogLevel = 'info' | 'ok' | 'err'

/** Ligne de log enrichie pour l'affichage de la console live. */
export interface DeploymentLog {
  time: string
  level: DeploymentLogLevel
  message: string
}

/**
 * Accès à la ressource (modèle UI), livré une seule fois au passage « running ».
 * Reflète ce que l'API expose réellement via SSE : l'adresse `host:port`
 * (`url`) et le mot de passe généré (`password`). Pas de notion d'utilisateur
 * dans le contrat — on n'affiche que ce que le back fournit.
 */
export interface DeploymentAccess {
  /** Adresse joignable `host:port`. */
  url: string
  /** Mot de passe généré, affiché une seule fois (jamais re-récupérable). */
  password: string
}

/**
 * Event de déploiement enrichi pour l'UI, issu du flux SSE réel
 * (`/deployments/{id}/events`). Chaque event met à jour le statut, ajoute une
 * ligne de log (dérivée du `message`) et, au passage « running », livre l'accès.
 */
export interface DeploymentEvent {
  status: DeploymentStatus
  log?: DeploymentLog
  access?: DeploymentAccess
}
