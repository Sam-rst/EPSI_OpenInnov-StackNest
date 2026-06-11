import type { EngineKind } from '../../types/enums/EngineKind'

/** Ressource provisionnable affichée dans le catalogue. */
export interface CatalogItem {
  id: string
  name: string
  /** Nom d'icône lucide kebab-case (ex. « database »). */
  icon: string
  category: string
  provider: string
  /** Moteur de provisioning (« docker » | « terraform »). Pilote l'état de la carte. */
  engine: EngineKind
  tags: readonly string[]
  description: string
  popular?: boolean
  /**
   * Déployable depuis l'UI. Faux pour un template visible mais bloqué (runtime
   * langage) : la carte est grisée avec l'étiquette « Bientôt disponible ».
   */
  deployable: boolean
}
