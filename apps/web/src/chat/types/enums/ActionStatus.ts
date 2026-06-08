import type { BadgeTone } from '../../../shared/components/ui'

/**
 * Cycle de vie d'une action proposée par l'assistant :
 *
 *     proposed → confirmed → executed
 *         │                     │
 *         └──→ rejected         └──→ failed
 *
 * `proposed` attend une décision de l'utilisateur (Confirmer / Modifier /
 * Annuler) ; `confirmed` a été validée (exécution déléguée au back) ; `rejected`
 * a été annulée ; `executed` / `failed` sont les états terminaux d'exécution.
 */
export const ActionStatus = {
  PROPOSED: 'proposed',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  EXECUTED: 'executed',
  FAILED: 'failed',
} as const

export type ActionStatus = (typeof ActionStatus)[keyof typeof ActionStatus]

/** Libellés français des statuts d'action (badge de la carte). */
export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  proposed: 'À confirmer',
  confirmed: 'Confirmée',
  rejected: 'Annulée',
  executed: 'Exécutée',
  failed: 'Échec',
}

/** Tons de badge (charte) associés à chaque statut d'action. */
export const ACTION_STATUS_TONES: Record<ActionStatus, BadgeTone> = {
  proposed: 'cyan',
  confirmed: 'cyan',
  rejected: 'neutral',
  executed: 'success',
  failed: 'danger',
}
