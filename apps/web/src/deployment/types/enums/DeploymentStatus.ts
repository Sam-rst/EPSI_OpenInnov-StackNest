import type { BadgeTone } from '../../../shared/components/ui'

/**
 * Statut d'un déploiement dans son cycle de vie — miroir de l'enum Postgres
 * `deployment_status` et de `app/deployment/domain/enums/deployment_status.py`.
 *
 * Machine à états (cf. design back §7) :
 *
 *     pending → provisioning → running ⇄ stopped
 *                                │         │
 *                                └─────────┴─→ destroying → destroyed
 *     (toute étape) ──────────────────────────────────────→ failed
 */
export const DeploymentStatus = {
  PENDING: 'pending',
  PROVISIONING: 'provisioning',
  RUNNING: 'running',
  STOPPED: 'stopped',
  FAILED: 'failed',
  DESTROYING: 'destroying',
  DESTROYED: 'destroyed',
} as const

export type DeploymentStatus = (typeof DeploymentStatus)[keyof typeof DeploymentStatus]

/** Libellés français affichés dans le badge de statut. */
export const DEPLOYMENT_STATUS_LABELS: Record<DeploymentStatus, string> = {
  pending: 'En attente',
  provisioning: 'Provisionnement',
  running: 'En ligne',
  stopped: 'Arrêté',
  failed: 'Échec',
  destroying: 'Suppression',
  destroyed: 'Supprimé',
}

/** Tons de badge (charte) associés à chaque statut. */
export const DEPLOYMENT_STATUS_TONES: Record<DeploymentStatus, BadgeTone> = {
  pending: 'neutral',
  provisioning: 'cyan',
  running: 'success',
  stopped: 'warn',
  failed: 'danger',
  destroying: 'warn',
  destroyed: 'neutral',
}

/** Renvoie le libellé français d'un statut (ou la valeur brute si inconnu). */
export function labelForStatus(status: string): string {
  return DEPLOYMENT_STATUS_LABELS[status as DeploymentStatus] ?? status
}

/** Renvoie le ton de badge d'un statut (neutre par défaut). */
export function toneForStatus(status: string): BadgeTone {
  return DEPLOYMENT_STATUS_TONES[status as DeploymentStatus] ?? 'neutral'
}

/** Statuts terminaux : aucune transition de cycle de vie n'est possible ensuite. */
const TERMINAL_STATUSES: ReadonlySet<DeploymentStatus> = new Set([DeploymentStatus.DESTROYED])

/** Indique si un statut est terminal (déploiement supprimé). */
export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.has(status as DeploymentStatus)
}
