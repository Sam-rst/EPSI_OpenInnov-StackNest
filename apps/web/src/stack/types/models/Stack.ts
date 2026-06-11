import type { ServiceStatus } from '../enums/ServiceStatus'
import type { StackStatus } from '../enums/StackStatus'

/**
 * Stack enrichie pour l'UI (modèle de liste). Porte le statut typé + son libellé
 * français et le nombre de services, prêt à piloter la liste `/stacks`.
 */
export interface StackSummary {
  id: string
  name: string
  status: StackStatus
  statusLabel: string
  /** Nombre de services composant la stack (0 si le résumé ne les porte pas). */
  serviceCount: number
  createdAt: string | null
  updatedAt: string | null
}

/**
 * Détail complet d'une stack (modèle UI). Les liens sont ré-exprimés par
 * **alias** (lisibles) plutôt que par ids techniques : le mapper réconcilie les
 * `from_service_id`/`to_service_id` de la réponse avec les alias des services.
 */
export interface StackDetailModel {
  id: string
  name: string
  status: StackStatus
  statusLabel: string
  services: readonly StackServiceModel[]
  links: readonly StackLinkModel[]
  createdAt: string | null
  updatedAt: string | null
}

/** Service membre d'une stack (modèle UI). */
export interface StackServiceModel {
  id: string
  templateId: string
  version: string
  alias: string
  status: ServiceStatus
  statusLabel: string
  orderIndex: number
  /** Params de provisioning (secrets déjà masqués côté API). */
  params: Record<string, unknown>
  /** Port publié sur l'hôte (alloué au run, lot 3), ou `null`. */
  publishedPort: number | null
  containerRef: string | null
}

/** Lien dirigé entre deux services (modèle UI, exprimé par alias). */
export interface StackLinkModel {
  id: string
  /** Alias du service consommateur (reçoit les variables). */
  fromAlias: string
  /** Alias du service fournisseur (source des variables). */
  toAlias: string
  /** Mapping `{ ENV_VAR : expression }` (sans secret). */
  varMappings: Record<string, string>
}
