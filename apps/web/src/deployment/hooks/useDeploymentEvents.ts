import { useEffect, useState } from 'react'

import { apiClient } from '../../core/api/apiClient'
import { mapDeploymentEventDto } from '../mappers/deploymentMapper'
import type { DeploymentEventDTO } from '../types/dto/DeploymentEventDTO'
import { DeploymentStatus } from '../types/enums/DeploymentStatus'
import { DeploymentStep } from '../types/enums/DeploymentStep'
import type {
  DeploymentAccess,
  DeploymentEvent,
  DeploymentLog,
} from '../types/models/DeploymentEvent'

/** Statuts terminaux côté flux : on ferme la connexion SSE une fois atteints. */
const FINAL_STATUSES: ReadonlySet<DeploymentStatus> = new Set([
  DeploymentStatus.RUNNING,
  DeploymentStatus.STOPPED,
  DeploymentStatus.FAILED,
  DeploymentStatus.DESTROYED,
])

/** Étape du stepper Docker déduite du statut courant du déploiement. */
const STEP_FOR_STATUS: Partial<Record<DeploymentStatus, DeploymentStep>> = {
  [DeploymentStatus.PENDING]: DeploymentStep.VALIDATION,
  [DeploymentStatus.PROVISIONING]: DeploymentStep.PULL_IMAGE,
  [DeploymentStatus.RUNNING]: DeploymentStep.READY,
}

interface DeploymentEventsState {
  logs: readonly DeploymentLog[]
  status: DeploymentStatus
  currentStep: DeploymentStep
  access: DeploymentAccess | undefined
  isDone: boolean
}

/** État interne : la progression accumulée, étiquetée par la cible courante. */
interface KeyedState {
  /** Identifiant du déploiement auquel se rapporte la progression. */
  id: string | undefined
  progress: DeploymentEventsState
}

export type UseDeploymentEventsResult = DeploymentEventsState

const INITIAL_STATE: DeploymentEventsState = {
  logs: [],
  status: DeploymentStatus.PENDING,
  currentStep: DeploymentStep.VALIDATION,
  access: undefined,
  isDone: false,
}

/** Applique un event SSE à l'état accumulé (logs, statut, étape, accès, fin). */
function reduceEvent(state: DeploymentEventsState, event: DeploymentEvent): DeploymentEventsState {
  const logs = event.log ? [...state.logs, event.log] : state.logs
  const status = event.status
  const access = event.access ?? state.access
  const currentStep = STEP_FOR_STATUS[status] ?? state.currentStep
  const isDone = state.isDone || FINAL_STATUSES.has(status)

  return { logs, status, access, currentStep, isDone }
}

/** Construit l'URL absolue du flux SSE à partir de la baseURL de l'apiClient. */
function buildEventsUrl(id: string): string {
  const baseUrl = apiClient.defaults.baseURL ?? ''
  return `${baseUrl}/deployments/${id}/events`
}

/**
 * S'abonne au flux SSE réel `GET /deployments/{id}/events` via un `EventSource`.
 * Chaque trame (`{status, message, access_url, secret}`) est mappée puis réduite
 * dans l'état : statut live, étape du stepper, logs accumulés et accès révélé une
 * seule fois au passage « running » (le secret n'arrive que par ce canal).
 *
 * La connexion est étiquetée par `id` : un changement de cible repart de l'état
 * initial. Le cleanup ferme proprement l'`EventSource` (changement d'id/démontage).
 */
export function useDeploymentEvents(id: string | undefined): UseDeploymentEventsResult {
  const [state, setState] = useState<KeyedState>({ id, progress: INITIAL_STATE })

  useEffect(() => {
    if (id === undefined) {
      return
    }

    const source = new EventSource(buildEventsUrl(id), { withCredentials: true })

    const onMessage = (message: MessageEvent<string>): void => {
      const dto = JSON.parse(message.data) as DeploymentEventDTO
      const event = mapDeploymentEventDto(dto)
      setState((previous) => {
        const base = previous.id === id ? previous.progress : INITIAL_STATE
        const progress = reduceEvent(base, event)
        if (progress.isDone) {
          source.close()
        }
        return { id, progress }
      })
    }

    // Le back nomme chaque trame d'après le statut (`event: running`, etc.). On
    // écoute donc chaque nom de statut, plus `message` par robustesse (trames non
    // nommées). Tous les écouteurs partagent le même réducteur.
    const eventNames = [...Object.values(DeploymentStatus), 'message']
    for (const name of eventNames) {
      source.addEventListener(name, onMessage as EventListener)
    }

    return () => {
      for (const name of eventNames) {
        source.removeEventListener(name, onMessage as EventListener)
      }
      source.close()
    }
  }, [id])

  // Tant que la progression stockée ne correspond pas à la cible demandée
  // (changement d'`id`, avant le premier event), on repart de l'état initial.
  return state.id === id ? state.progress : INITIAL_STATE
}
