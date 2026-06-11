import { type EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useState } from 'react'

import { apiClient } from '../../core/api/apiClient'
import { refreshAccessToken } from '../../core/api/refreshSession'
import { getAccessToken } from '../../core/api/tokenStore'
import type { StackEventDTO } from '../types/dto/StackEventDTO'
import { ServiceStatus, toServiceStatus } from '../types/enums/ServiceStatus'
import { StackStatus, toStackStatus } from '../types/enums/StackStatus'

/** Code HTTP signalant un access token absent/expiré sur le flux SSE. */
const UNAUTHORIZED = 401

/** Nombre maximal de refresh + reconnexion sur 401 (borne la boucle de retry). */
const MAX_REFRESH_RETRIES = 1

/**
 * Statuts globaux terminaux : on ferme la connexion SSE là (provisioning fini).
 * `running`/`partial`/`failed`/`destroyed` clôturent le cycle de provisioning.
 */
const FINAL_STATUSES: ReadonlySet<StackStatus> = new Set([
  StackStatus.RUNNING,
  StackStatus.PARTIAL,
  StackStatus.FAILED,
  StackStatus.DESTROYED,
])

/** État live agrégé d'une stack : statut global + statut par service (alias). */
export interface StackEventsState {
  status: StackStatus
  /** Statut courant de chaque service, indexé par alias. */
  serviceStatuses: Record<string, ServiceStatus>
  /** Le provisioning est terminé (statut global terminal). */
  isDone: boolean
  /** Le flux a échoué de façon non récupérable (refresh perdu, erreur réseau). */
  isError: boolean
  /** Au moins une trame a été reçue (sinon on dégrade vers le statut REST). */
  hasProgressed: boolean
}

export const INITIAL_STACK_EVENTS_STATE: StackEventsState = {
  status: StackStatus.PENDING,
  serviceStatuses: {},
  isDone: false,
  isError: false,
  hasProgressed: false,
}

/** État interne : la progression accumulée, étiquetée par la stack courante. */
interface KeyedState {
  id: string | undefined
  progress: StackEventsState
}

/** Erreur interne signalant un 401 sur le flux SSE (access token expiré). */
class UnauthorizedStreamError extends Error {}

/** Applique une trame SSE à l'état accumulé (statut global + service ciblé). */
export function reduceStackEvent(state: StackEventsState, event: StackEventDTO): StackEventsState {
  const status = toStackStatus(event.status)
  const serviceStatuses =
    event.alias && event.service_status
      ? { ...state.serviceStatuses, [event.alias]: toServiceStatus(event.service_status) }
      : state.serviceStatuses

  return {
    ...state,
    status,
    serviceStatuses,
    isDone: state.isDone || FINAL_STATUSES.has(status),
    hasProgressed: true,
  }
}

/** Construit l'URL absolue du flux SSE à partir de la baseURL de l'apiClient. */
function buildEventsUrl(id: string): string {
  const baseUrl = apiClient.defaults.baseURL ?? ''
  return `${baseUrl}/stacks/${id}/events`
}

/** En-têtes du flux SSE : l'access token courant en Bearer (lu à chaque ouverture). */
function buildHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * S'abonne au flux SSE réel `GET /stacks/{id}/events` (lot 3, worker) via
 * `fetchEventSource` pour porter le `Authorization: Bearer`. Chaque trame met à
 * jour le statut global et, s'il est ciblé, le statut d'un service (par alias).
 *
 * Dégradation propre : si l'endpoint n'existe pas encore (404 / réseau), le hook
 * passe en `isError` **sans** `hasProgressed` — la page retombe alors sur les
 * statuts REST (cf. `StackDetailPage`). Sur 401, le token est rafraîchi puis le
 * flux rouvert (borné). Le cleanup abandonne le `fetch` (changement d'id /
 * démontage / statut terminal).
 */
export function useStackEvents(id: string | undefined): StackEventsState {
  const [state, setState] = useState<KeyedState>({ id, progress: INITIAL_STACK_EVENTS_STATE })

  useEffect(() => {
    if (id === undefined) {
      return
    }

    const controller = new AbortController()

    const applyEvent = (message: EventSourceMessage): void => {
      const dto = JSON.parse(message.data) as StackEventDTO
      setState((previous) => {
        const base = previous.id === id ? previous.progress : INITIAL_STACK_EVENTS_STATE
        const progress = reduceStackEvent(base, dto)
        if (progress.isDone) {
          controller.abort()
        }
        return { id, progress }
      })
    }

    const markError = (): void => {
      setState((previous) => {
        const base = previous.id === id ? previous.progress : INITIAL_STACK_EVENTS_STATE
        return { id, progress: { ...base, isError: true } }
      })
    }

    const openStream = (): Promise<void> =>
      fetchEventSource(buildEventsUrl(id), {
        signal: controller.signal,
        headers: buildHeaders(),
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
        onerror: (error) => {
          throw error
        },
      })

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

  return state.id === id ? state.progress : INITIAL_STACK_EVENTS_STATE
}
