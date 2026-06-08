/**
 * Preset de limites de ressources conteneur (cpu/mémoire). Remplace les tailles
 * « cloud » du mockup par des plafonds Docker honnêtes (cf. spec front §4 :
 * limites cpu/mém via presets S/M/L, pas de tailles cloud ni de coût).
 */
export interface ResourcePreset {
  id: 'small' | 'medium' | 'large'
  label: string
  /** Plafond CPU en vCPU. */
  cpu: number
  /** Plafond mémoire en mégaoctets. */
  memoryMb: number
}

/** Presets de capacité Docker disponibles à la configuration. */
export const RESOURCE_PRESETS: readonly ResourcePreset[] = [
  { id: 'small', label: 'S', cpu: 0.5, memoryMb: 512 },
  { id: 'medium', label: 'M', cpu: 1, memoryMb: 1024 },
  { id: 'large', label: 'L', cpu: 2, memoryMb: 2048 },
]
