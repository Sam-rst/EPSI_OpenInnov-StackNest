import type { ActionKind } from '../enums/ActionKind'
import type { ActionStatus } from '../enums/ActionStatus'

/** Ligne du récap d'une action : libellé + valeur affichée (params, quotas). */
export interface ActionRecapEntry {
  label: string
  value: string
}

/**
 * Proposition d'action enrichie pour l'UI (carte de confirmation avancée).
 * `kind` / `status` sont des enums typés ; `params` et `quotas` sont aplatis en
 * listes ordonnées prêtes à l'affichage. `templateId` / `version` alimentent le
 * bouton « Modifier » → `/deployments/config?template=...`.
 */
export interface ActionProposal {
  id: string
  kind: ActionKind
  status: ActionStatus
  /** Reformulation de l'intention détectée (bandeau de la carte). */
  intent: string
  /** Template du catalogue ciblé, ou `null`. */
  templateId: string | null
  /** Version d'image figée, ou `null`. */
  version: string | null
  /** Image Docker figée, ou `null`. */
  image: string | null
  /** Récap des paramètres (clé/valeur ordonnés). */
  params: readonly ActionRecapEntry[]
  /** Récap des quotas/limites (clé/valeur ordonnés). */
  quotas: readonly ActionRecapEntry[]
}
