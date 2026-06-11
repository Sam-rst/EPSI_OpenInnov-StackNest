import type { TemplateConfig } from '../../../deployment/types/models/TemplateConfig'

/**
 * Service en cours de composition dans le builder (état local, non persisté).
 * Porte sa fiche catalogue (`template`, pour le formulaire de params et la
 * dérivation des mappings de liens), un identifiant local stable (`localId`,
 * pour les clés React), l'alias éditable, la version et les valeurs de params.
 */
export interface CompositionService {
  /** Identifiant local stable (clé React), distinct de l'alias éditable. */
  localId: string
  /** Fiche catalogue du template, source des versions/params/descripteur. */
  template: TemplateConfig
  /** Alias unique dans la stack (clé compose, DNS interne) — éditable. */
  alias: string
  version: string
  /** Valeurs des paramètres de provisioning (clé → valeur saisie). */
  params: Record<string, string>
}

/**
 * Lien dirigé en cours de composition. Exprimé par les `localId` des services
 * (stables même si l'alias change), et un mapping `{ ENV_VAR : expression }`.
 */
export interface CompositionLink {
  /** Identifiant local stable du lien (clé React). */
  localId: string
  /** `localId` du service consommateur (reçoit les variables). */
  fromLocalId: string
  /** `localId` du service fournisseur (source des variables). */
  toLocalId: string
  /** Mapping variable → expression (résolu côté worker). */
  varMappings: Record<string, string>
}
