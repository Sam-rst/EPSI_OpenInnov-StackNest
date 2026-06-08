import { apiClient } from '../../core/api/apiClient'
import { mapDeploymentDto } from '../mappers/deploymentMapper'
import type { DeploymentDTO } from '../types/dto/DeploymentDTO'
import type { DeploymentWriteDTO } from '../types/dto/DeploymentWriteDTO'
import type { Deployment } from '../types/models/Deployment'

/**
 * Service de la feature déploiement, branché sur l'API REST `/deployments`.
 *
 * Pattern identique au catalogue : les composants consomment des modèles via ce
 * service, qui appelle `apiClient` et mappe les réponses. Le secret ne transite
 * jamais par REST : il n'apparaît qu'une seule fois dans le flux SSE
 * (`useDeploymentEvents`), au passage « running ».
 *
 *   - `GET /deployments`                         → listDeployments()
 *   - `GET /deployments/{id}`                    → getDeployment(id)
 *   - `POST /deployments`                        → createDeployment(payload)
 *   - `POST /deployments/{id}/{action}` (202)    → stop / start / destroy / regenerate
 */

const DEPLOYMENTS_PATH = '/deployments'

/** Corps réellement accepté par `POST /deployments` (cf. `DeploymentCreateRequest`). */
interface CreateDeploymentBody {
  template_id: string
  version: string
  name: string
  params: Record<string, string>
}

/** Liste les déploiements de l'utilisateur authentifié (`GET /deployments`). */
export async function listDeployments(): Promise<readonly Deployment[]> {
  const { data } = await apiClient.get<DeploymentDTO[]>(DEPLOYMENTS_PATH)
  return data.map(mapDeploymentDto)
}

/** Récupère le détail d'un déploiement possédé (`GET /deployments/{id}`). */
export async function getDeployment(id: string): Promise<Deployment> {
  const { data } = await apiClient.get<DeploymentDTO>(`${DEPLOYMENTS_PATH}/${id}`)
  return mapDeploymentDto(data)
}

/** Identifiant du déploiement créé, pour naviguer vers sa page de suivi. */
export interface CreateDeploymentResult {
  id: string
}

/**
 * Crée un déploiement et lance son provisioning (`POST /deployments` → 201).
 * N'envoie que les champs acceptés par l'API (`env` et `limits` du formulaire ne
 * font pas partie du contrat back). Renvoie l'identifiant du déploiement créé.
 */
export async function createDeployment(
  payload: DeploymentWriteDTO,
): Promise<CreateDeploymentResult> {
  const body: CreateDeploymentBody = {
    template_id: payload.template_id,
    version: payload.version,
    name: payload.name,
    params: payload.params,
  }
  const { data } = await apiClient.post<DeploymentDTO>(DEPLOYMENTS_PATH, body)
  return { id: data.id }
}

/**
 * Actions de cycle de vie (asynchrones côté back : `202 Accepted`, job enfilé).
 * Le rafraîchissement de l'UI est piloté par l'invalidation React Query côté hook.
 *   - stopDeployment              → POST /deployments/{id}/stop
 *   - startDeployment             → POST /deployments/{id}/start
 *   - destroyDeployment           → POST /deployments/{id}/destroy
 *   - regenerateDeploymentPassword→ POST /deployments/{id}/regenerate-password
 */
export async function stopDeployment(id: string): Promise<void> {
  await apiClient.post(`${DEPLOYMENTS_PATH}/${id}/stop`)
}

export async function startDeployment(id: string): Promise<void> {
  await apiClient.post(`${DEPLOYMENTS_PATH}/${id}/start`)
}

export async function destroyDeployment(id: string): Promise<void> {
  await apiClient.post(`${DEPLOYMENTS_PATH}/${id}/destroy`)
}

export async function regenerateDeploymentPassword(id: string): Promise<void> {
  await apiClient.post(`${DEPLOYMENTS_PATH}/${id}/regenerate-password`)
}
