/**
 * Miroir d'un event SSE du flux `GET /deployments/{id}/events` (back §5/§7).
 *
 * Deux familles d'events :
 * - transition de statut (`status` renseigné) → met à jour le badge + le stepper ;
 * - ligne de log (`log` renseigné) → append dans la console live.
 *
 * Le champ `access` (host/port/user/password) n'est présent QU'UNE seule fois,
 * dans l'event de passage à « running ». Le mot de passe n'est jamais reloggé.
 */
export interface DeploymentEventDTO {
  /** Horodatage ISO 8601 de l'event. */
  at: string
  /** Nouveau statut (valeur brute de `deployment_status`), si transition. */
  status?: string
  /** Ligne de log streamée, si event de log. */
  log?: DeploymentLogDTO
  /** Accès complets transmis une seule fois au passage « running ». */
  access?: DeploymentAccessDTO
}

/** Niveau d'une ligne de log streamée. */
export type DeploymentLogLevelDTO = 'info' | 'ok' | 'err'

/** Une ligne de log `docker logs` streamée via SSE. */
export interface DeploymentLogDTO {
  /** Horodatage court affiché (ex. « 14:32:18 »). */
  time: string
  level: DeploymentLogLevelDTO
  message: string
}

/** Accès à la ressource, transmis une seule fois (event « running »). */
export interface DeploymentAccessDTO {
  host: string
  port: number
  user: string
  /** Mot de passe généré, affiché une seule fois (jamais re-récupérable). */
  password: string
}
