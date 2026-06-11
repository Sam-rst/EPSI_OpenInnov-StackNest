import { apiClient } from '../../core/api/apiClient'
import { mapStackDetail, mapStackSummary } from '../mappers/stackMapper'
import type { StackDTO } from '../types/dto/StackDTO'
import type { StackWriteDTO } from '../types/dto/StackWriteDTO'
import type { StackDetailModel, StackSummary } from '../types/models/Stack'

/**
 * Service de la feature stack, branché sur l'API REST `/stacks` (lots 1-2).
 *
 * Les composants consomment des modèles via ce service, qui appelle `apiClient`
 * et mappe les réponses. Aucun secret ne transite par REST : les params `secret`
 * des services arrivent déjà masqués côté API (cf. design § Sécurité).
 *
 *   - `GET /stacks`             → listStacks()
 *   - `GET /stacks/{id}`        → getStack(id)
 *   - `POST /stacks` (201)      → createStack(payload)
 *   - `DELETE /stacks/{id}` (204) → deleteStack(id)
 */

const STACKS_PATH = '/stacks'

/** Liste les stacks de l'utilisateur authentifié (`GET /stacks`). */
export async function listStacks(): Promise<readonly StackSummary[]> {
  const { data } = await apiClient.get<StackDTO[]>(STACKS_PATH)
  return data.map(mapStackSummary)
}

/** Récupère le détail d'une stack possédée (`GET /stacks/{id}`). */
export async function getStack(id: string): Promise<StackDetailModel> {
  const { data } = await apiClient.get<StackDTO>(`${STACKS_PATH}/${id}`)
  return mapStackDetail(data)
}

/** Identifiant de la stack créée, pour rediriger vers son détail. */
export interface CreateStackResult {
  id: string
}

/**
 * Crée une stack et enfile son provisioning (`POST /stacks` → 201). Le payload
 * exprime les liens par **alias** (`from_alias`/`to_alias`), conformément au
 * contrat lot 2. Renvoie l'identifiant de la stack créée.
 */
export async function createStack(payload: StackWriteDTO): Promise<CreateStackResult> {
  const { data } = await apiClient.post<StackDTO>(STACKS_PATH, payload)
  return { id: data.id }
}

/** Détruit une stack possédée (`DELETE /stacks/{id}` → 204). */
export async function deleteStack(id: string): Promise<void> {
  await apiClient.delete(`${STACKS_PATH}/${id}`)
}
