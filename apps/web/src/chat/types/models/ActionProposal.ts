import type { ActionKind } from '../enums/ActionKind'
import type { ActionStatus } from '../enums/ActionStatus'

/** Ligne du récap d'une action : libellé + valeur affichée (params, quotas). */
export interface ActionRecapEntry {
  label: string
  value: string
}

/** Service membre d'une composition de stack, affiché dans la carte. */
export interface StackServiceRecap {
  /** Alias unique du service dans la stack (hôte réseau interne). */
  alias: string
  /** Version d'image figée du service. */
  version: string
}

/** Lien dirigé entre deux services d'une stack (câblage), affiché dans la carte. */
export interface StackLinkRecap {
  /** Alias du service consommateur. */
  from: string
  /** Alias du service fournisseur. */
  to: string
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
  /**
   * Services composant la stack (action `compose_stack` uniquement), ordonnés.
   * Vide pour les actions de déploiement.
   */
  stackServices: readonly StackServiceRecap[]
  /**
   * Liens câblant les services de la stack (action `compose_stack` uniquement).
   * Vide pour les actions de déploiement.
   */
  stackLinks: readonly StackLinkRecap[]
  /**
   * Déploiement créé une fois l'action `deploy` exécutée avec succès, ou
   * `null`/absent. Alimente le CTA « Voir le déploiement → » de la carte.
   */
  deploymentId?: string | null
  /**
   * Stack créée une fois l'action `compose_stack` exécutée avec succès, ou
   * `null`/absent. Alimente le CTA « Voir la stack → » de la carte.
   */
  stackId?: string | null
}
