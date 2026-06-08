/**
 * Moteur de provisioning d'un template du catalogue — miroir de l'enum Postgres
 * `engine_kind` et de `app/catalog/domain/enums/engine_kind.py` côté API.
 *
 * Discriminateur du parcours de déploiement : `docker` ouvre la configuration
 * conteneur + l'aperçu Docker ; `terraform` affiche un écran « à venir » (non
 * déployable au MVP).
 */
export const EngineKind = {
  DOCKER: 'docker',
  TERRAFORM: 'terraform',
} as const

export type EngineKind = (typeof EngineKind)[keyof typeof EngineKind]

/** Libellés français affichés dans le badge moteur. */
export const ENGINE_KIND_LABELS: Record<EngineKind, string> = {
  docker: 'Docker',
  terraform: 'Terraform',
}

/** Renvoie le libellé français d'un moteur (ou la valeur brute si inconnu). */
export function labelForEngine(engine: string): string {
  return ENGINE_KIND_LABELS[engine as EngineKind] ?? engine
}

/** Indique si une valeur brute correspond au moteur Docker (seul déployable au MVP). */
export function isDockerEngine(engine: string): boolean {
  return engine === EngineKind.DOCKER
}
