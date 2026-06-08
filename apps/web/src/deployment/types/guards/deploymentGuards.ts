import { DeploymentStatus } from '../enums/DeploymentStatus'
import { EngineKind } from '../enums/EngineKind'

const ENGINE_VALUES: ReadonlySet<string> = new Set(Object.values(EngineKind))
const STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(DeploymentStatus))

/** Garde de type : la valeur brute est un `EngineKind` connu. */
export function isEngineKind(value: string): value is EngineKind {
  return ENGINE_VALUES.has(value)
}

/** Garde de type : la valeur brute est un `DeploymentStatus` connu. */
export function isDeploymentStatus(value: string): value is DeploymentStatus {
  return STATUS_VALUES.has(value)
}

/**
 * Normalise un moteur brut en `EngineKind`, avec repli sur `DOCKER`.
 * Le catalogue garantit `engine` NOT NULL défaut `docker` : une valeur inconnue
 * traduit un contrat futur non géré, on reste sur le parcours Docker par défaut.
 */
export function toEngineKind(value: string): EngineKind {
  return isEngineKind(value) ? value : EngineKind.DOCKER
}

/**
 * Normalise un statut brut en `DeploymentStatus`, avec repli sur `PENDING`.
 * Un statut inconnu (contrat futur) est traité comme un état initial neutre.
 */
export function toDeploymentStatus(value: string): DeploymentStatus {
  return isDeploymentStatus(value) ? value : DeploymentStatus.PENDING
}
