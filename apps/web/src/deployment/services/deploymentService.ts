import { mapDeploymentDto } from '../mappers/deploymentMapper'
import type { DeploymentWriteDTO } from '../types/dto/DeploymentWriteDTO'
import type { Deployment } from '../types/models/Deployment'
import { EXAMPLE_DEPLOYMENTS, findExampleDeployment } from './deploymentFixtures'

/**
 * Service-seam de la feature déploiement (display-only).
 *
 * Pattern identique au catalogue : les composants consomment des modèles via ce
 * service. Aujourd'hui il lit des fixtures d'EXEMPLE ; au branchement (slice de
 * wiring suivante) chaque fonction appellera l'API réelle (`apiClient`) en
 * conservant exactement la même signature publique :
 *   - `GET /deployments`            → listDeployments()
 *   - `GET /deployments/{id}`       → getDeployment(id)
 *   - `POST /deployments`          → createDeployment(payload)
 *
 * Aucune donnée réelle ni credential ici : tout est fictif et marqué « exemple ».
 */

/** Latence simulée (ms) pour rendre visibles les états de chargement. */
const SIMULATED_LATENCY_MS = 250

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/** Liste les déploiements de l'utilisateur (display-only : fixtures d'exemple). */
export async function listDeployments(): Promise<readonly Deployment[]> {
  await delay(SIMULATED_LATENCY_MS)
  return EXAMPLE_DEPLOYMENTS.map(mapDeploymentDto)
}

/** Récupère le détail d'un déploiement (display-only : fixtures d'exemple). */
export async function getDeployment(id: string): Promise<Deployment> {
  await delay(SIMULATED_LATENCY_MS)
  const dto = findExampleDeployment(id)
  if (dto === undefined) {
    throw new Error(`Déploiement introuvable (exemple) : ${id}`)
  }
  return mapDeploymentDto(dto)
}

/** Identifiant renvoyé par la simulation de création. */
export interface CreateDeploymentResult {
  id: string
}

/**
 * Simule la création d'un déploiement (display-only). Renvoie un identifiant
 * d'exemple stable permettant de naviguer vers la page de suivi simulée.
 * Au branchement : `POST /deployments` → `{ id }` du déploiement réel.
 */
export async function createDeployment(
  payload: DeploymentWriteDTO,
): Promise<CreateDeploymentResult> {
  await delay(SIMULATED_LATENCY_MS)
  // En display-only on ne persiste rien : on ouvre la page de suivi d'exemple.
  void payload
  return { id: 'exemple-pg' }
}

/**
 * Actions de cycle de vie (stubs display-only). Au branchement, chacune appellera
 * `POST /deployments/{id}/{action}` puis invalidera le cache React Query.
 *   - stopDeployment   → POST /deployments/{id}/stop
 *   - startDeployment  → POST /deployments/{id}/start
 *   - destroyDeployment→ POST /deployments/{id}/destroy
 *   - regeneratePassword → POST /deployments/{id}/regenerate-password
 */
export async function stopDeployment(id: string): Promise<void> {
  await delay(SIMULATED_LATENCY_MS)
  void id
}

export async function startDeployment(id: string): Promise<void> {
  await delay(SIMULATED_LATENCY_MS)
  void id
}

export async function destroyDeployment(id: string): Promise<void> {
  await delay(SIMULATED_LATENCY_MS)
  void id
}

export async function regenerateDeploymentPassword(id: string): Promise<void> {
  await delay(SIMULATED_LATENCY_MS)
  void id
}
