import { type EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useState } from 'react'

import { apiClient } from '../../core/api/apiClient'
import { refreshAccessToken } from '../../core/api/refreshSession'
import { getAccessToken } from '../../core/api/tokenStore'
import { mapDeploymentEventDto } from '../mappers/deploymentMapper'
import type { DeploymentEventDTO } from '../types/dto/DeploymentEventDTO'
import { DeploymentStatus } from '../types/enums/DeploymentStatus'
import { DeploymentStep } from '../types/enums/DeploymentStep'
import type {
  DeploymentAccess,
  DeploymentEvent,
  DeploymentLog,
} from '../types/models/DeploymentEvent'

/** Code HTTP signalant un access token absent/expiré sur le flux SSE. */
const UNAUTHORIZED = 401

/** Nombre maximal de refresh + reconnexion sur 401 (borne la boucle de retry). */
const MAX_REFRESH_RETRIES = 1

/**
 * Statuts VRAIMENT terminaux côté flux : on ne ferme la connexion SSE que là
 * (#16). `running`/`stopped` ne sont PAS terminaux — le cycle de vie continue
 * (start/stop/destroy) et ces transitions doivent arriver en live. Fermer sur
 * `running`/`stopped` figeait l'UI jusqu'au rechargement (cause du retour #16).
 */
const FINAL_STATUSES: ReadonlySet<DeploymentStatus> = new Set([
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
  /** Le flux a échoué de façon non récupérable (refresh perdu, erreur réseau dure). */
  isError: boolean
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
  isError: false,
}

/**
 * Erreur interne signalant un 401 sur le flux SSE : l'access token est expiré.
 * On la distingue d'une erreur réseau pour ne déclencher le refresh que sur 401.
 */
class UnauthorizedStreamError extends Error {}

/** Applique un event SSE à l'état accumulé (logs, statut, étape, accès, fin). */
function reduceEvent(state: DeploymentEventsState, event: DeploymentEvent): DeploymentEventsState {
  const logs = event.log ? [...state.logs, event.log] : state.logs
  const status = event.status
  const access = event.access ?? state.access
  const currentStep = STEP_FOR_STATUS[status] ?? state.currentStep
  const isDone = state.isDone || FINAL_STATUSES.has(status)

  return { ...state, logs, status, access, currentStep, isDone }
}

/** Construit l'URL absolue du flux SSE à partir de la baseURL de l'apiClient. */
function buildEventsUrl(id: string): string {
  const baseUrl = apiClient.defaults.baseURL ?? ''
  return `${baseUrl}/deployments/${id}/events`
}

/** En-têtes du flux SSE : l'access token courant en Bearer (lu à chaque ouverture). */
function buildHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * S'abonne au flux SSE réel `GET /deployments/{id}/events` via `fetchEventSource`
 * (lib Microsoft, ouverture par `fetch`) afin de porter le header `Authorization:
 * Bearer <access>` — ce qu'un `EventSource` natif ne peut pas faire (il n'envoie
 * que les cookies). Chaque trame (`{status, message, access_url, secret}`) est
 * mappée puis réduite : statut live, étape du stepper, logs accumulés et accès
 * révélé une seule fois au passage « running » (le secret n'arrive que par ce canal).
 *
 * Sur 401 (access token expiré), le token est rafraîchi via le flux existant
 * (`refreshAccessToken`) puis le flux est rouvert avec le nouveau Bearer ; le
 * nombre de refresh est borné pour éviter toute boucle. La connexion est étiquetée
 * par `id` : un changement de cible repart de l'état initial. Le cleanup abandonne
 * le `fetch` via `AbortController` (changement d'id, démontage, statut terminal).
 */
export function useDeploymentEvents(id: string | undefined): UseDeploymentEventsResult {
  const [state, setState] = useState<KeyedState>({ id, progress: INITIAL_STATE })

  useEffect(() => {
    if (id === undefined) {
      return
    }

    const controller = new AbortController()

    const applyEvent = (message: EventSourceMessage): void => {
      const dto = JSON.parse(message.data) as DeploymentEventDTO
      const event = mapDeploymentEventDto(dto)
      setState((previous) => {
        const base = previous.id === id ? previous.progress : INITIAL_STATE
        const progress = reduceEvent(base, event)
        if (progress.isDone) {
          controller.abort()
        }
        return { id, progress }
      })
    }

    const markError = (): void => {
      setState((previous) => {
        const base = previous.id === id ? previous.progress : INITIAL_STATE
        return { id, progress: { ...base, isError: true } }
      })
    }

    /** Ouvre le flux SSE ; la promesse rejette sur toute erreur (401, réseau). */
    const openStream = (): Promise<void> =>
      fetchEventSource(buildEventsUrl(id), {
        signal: controller.signal,
        headers: buildHeaders(),
        // On ne coupe pas le flux quand l'onglet passe en arrière-plan : un
        // déploiement peut être long et l'utilisateur attend la fin en aveugle.
        openWhenHidden: true,
        onopen: (response) => {
          if (response.status === UNAUTHORIZED) {
            throw new UnauthorizedStreamError()
          }
          if (!response.ok) {
            throw new Error(`Flux SSE en erreur (HTTP ${response.status}).`)
          }
          return Promise.resolve()
        },
        onmessage: applyEvent,
        // On désactive le retry intégré de la lib (qui rejouerait avec l'ancien
        // Bearer) : toute erreur fait rejeter la promesse, qu'on gère ici-même.
        onerror: (error) => {
          throw error
        },
      })

    /** Boucle d'ouverture : rafraîchit puis rouvre sur 401, borné par `retries`. */
    const run = async (retries: number): Promise<void> => {
      try {
        await openStream()
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        const canRefresh = error instanceof UnauthorizedStreamError && retries > 0
        if (!canRefresh) {
          markError()
          return
        }
        try {
          await refreshAccessToken(apiClient)
        } catch {
          markError()
          return
        }
        await run(retries - 1)
      }
    }

    void run(MAX_REFRESH_RETRIES)

    return () => {
      controller.abort()
    }
  }, [id])

  // Tant que la progression stockée ne correspond pas à la cible demandée
  // (changement d'`id`, avant le premier event), on repart de l'état initial.
  return state.id === id ? state.progress : INITIAL_STATE
}
