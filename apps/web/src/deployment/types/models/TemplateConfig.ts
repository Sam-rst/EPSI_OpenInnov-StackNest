import type { EngineKind } from '../enums/EngineKind'
import type { ParamKind } from '../enums/ParamKind'

/**
 * Template enrichi pour la configuration d'un déploiement (modèle UI).
 * Porte le moteur typé + le descripteur de provisioning + les versions/params
 * triés, prêt à piloter ConfigPage. Les composants reçoivent ce modèle.
 */
export interface TemplateConfig {
  id: string
  name: string
  icon: string
  description: string
  engine: EngineKind
  imageRepository: string | null
  internalPort: number | null
  secretEnv: string | null
  versions: readonly TemplateConfigVersion[]
  params: readonly TemplateConfigParam[]
}

/** Version disponible (modèle UI). */
export interface TemplateConfigVersion {
  version: string
  isDefault: boolean
  isLts: boolean
  eolDate: string | null
}

/** Paramètre de provisioning (modèle UI). */
export interface TemplateConfigParam {
  key: string
  label: string
  type: ParamKind
  required: boolean
  defaultValue: string | null
  options: readonly string[] | null
  orderIndex: number
  /**
   * Bornes optionnelles d'un paramètre numérique (`int`), reflétant le
   * descripteur catalogue quand le back les fournit. Absentes (`undefined`) tant
   * que le contrat ne les expose pas — l'UI reste alors non bornée (défensif #6).
   */
  min?: number
  max?: number
  step?: number
}
