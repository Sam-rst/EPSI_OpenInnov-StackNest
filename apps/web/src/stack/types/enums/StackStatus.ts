import type { BadgeTone } from '../../../shared/components/ui'

/**
 * Statut global d'une stack — miroir de l'enum Postgres `stack_status` et de
 * `app/stack/domain/enums/stack_status.py`.
 *
 * Une stack agrège N services déployés comme un projet `docker compose` ; son
 * statut est l'agrégat des statuts de ses services (cf. design « Lifecycle 2
 * niveaux ») :
 *
 *     pending → provisioning → running / partial / failed
 *                                 │
 *                                 └─→ destroying → destroyed
 */
export const StackStatus = {
  PENDING: 'pending',
  PROVISIONING: 'provisioning',
  RUNNING: 'running',
  PARTIAL: 'partial',
  FAILED: 'failed',
  DESTROYING: 'destroying',
  DESTROYED: 'destroyed',
} as const

export type StackStatus = (typeof StackStatus)[keyof typeof StackStatus]

const STACK_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(StackStatus))

/** Libellés français affichés dans le badge de statut global. */
export const STACK_STATUS_LABELS: Record<StackStatus, string> = {
  pending: 'En attente',
  provisioning: 'Provisionnement',
  running: 'En ligne',
  partial: 'Partiel',
  failed: 'Échec',
  destroying: 'Suppression',
  destroyed: 'Supprimé',
}

/** Tons de badge (charte) associés à chaque statut global. */
export const STACK_STATUS_TONES: Record<StackStatus, BadgeTone> = {
  pending: 'neutral',
  provisioning: 'cyan',
  running: 'success',
  partial: 'warn',
  failed: 'danger',
  destroying: 'warn',
  destroyed: 'neutral',
}

/** Normalise un statut brut en `StackStatus`, avec repli sur `pending`. */
export function toStackStatus(value: string): StackStatus {
  return STACK_STATUS_VALUES.has(value) ? (value as StackStatus) : StackStatus.PENDING
}

/** Renvoie le libellé français d'un statut global (ou la valeur brute si inconnu). */
export function labelForStackStatus(status: string): string {
  return STACK_STATUS_LABELS[status as StackStatus] ?? status
}

/** Renvoie le ton de badge d'un statut global (neutre par défaut). */
export function toneForStackStatus(status: string): BadgeTone {
  return STACK_STATUS_TONES[status as StackStatus] ?? 'neutral'
}
