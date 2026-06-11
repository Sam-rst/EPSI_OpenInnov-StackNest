import type { BadgeTone } from '../../../shared/components/ui'

/**
 * Statut d'un service membre d'une stack — miroir de l'enum Postgres
 * `service_status` et de `app/stack/domain/enums/service_status.py`.
 *
 * Vocabulaire minimal aligné sur le provisioning compose : en v1 un service n'a
 * pas de cycle stop/start individuel (reporté en v2).
 */
export const ServiceStatus = {
  PENDING: 'pending',
  PROVISIONING: 'provisioning',
  RUNNING: 'running',
  FAILED: 'failed',
  DESTROYED: 'destroyed',
} as const

export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus]

const SERVICE_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(ServiceStatus))

/** Libellés français affichés sur chaque service du détail. */
export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  pending: 'En attente',
  provisioning: 'Provisionnement',
  running: 'En ligne',
  failed: 'Échec',
  destroyed: 'Supprimé',
}

/** Tons de badge (charte) associés à chaque statut de service. */
export const SERVICE_STATUS_TONES: Record<ServiceStatus, BadgeTone> = {
  pending: 'neutral',
  provisioning: 'cyan',
  running: 'success',
  failed: 'danger',
  destroyed: 'neutral',
}

/** Normalise un statut brut en `ServiceStatus`, avec repli sur `pending`. */
export function toServiceStatus(value: string): ServiceStatus {
  return SERVICE_STATUS_VALUES.has(value) ? (value as ServiceStatus) : ServiceStatus.PENDING
}

/** Renvoie le libellé français d'un statut de service (ou la valeur brute si inconnu). */
export function labelForServiceStatus(status: string): string {
  return SERVICE_STATUS_LABELS[status as ServiceStatus] ?? status
}

/** Renvoie le ton de badge d'un statut de service (neutre par défaut). */
export function toneForServiceStatus(status: string): BadgeTone {
  return SERVICE_STATUS_TONES[status as ServiceStatus] ?? 'neutral'
}
