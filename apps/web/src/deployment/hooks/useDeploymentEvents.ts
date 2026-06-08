import { useEffect, useState } from 'react'

import { EXAMPLE_DEPLOYMENT_EVENTS } from '../services/deploymentEventFixtures'
import { DeploymentStatus } from '../types/enums/DeploymentStatus'
import { DeploymentStep } from '../types/enums/DeploymentStep'
import type {
  DeploymentAccess,
  DeploymentEvent,
  DeploymentLog,
} from '../types/models/DeploymentEvent'

/** Délai (ms) entre deux events de la progression simulée. */
const EVENT_INTERVAL_MS = 900

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

/**
 * Déduit l'étape Docker courante d'une ligne de log d'exemple (mots-clés du
 * scénario simulé). Sert à piloter le stepper sans event « step » dédié.
 */
function stepFromLog(message: string): DeploymentStep | undefined {
  if (message.includes('Validation')) return DeploymentStep.VALIDATION
  if (message.includes('Pull')) return DeploymentStep.PULL_IMAGE
  if (message.includes('Création du conteneur')) return DeploymentStep.CREATE_CONTAINER
  if (message.includes('Démarrage')) return DeploymentStep.START
  return undefined
}

/** Applique un event à l'état accumulé (logs, statut, étape, accès). */
function reduceEvent(state: DeploymentEventsState, event: DeploymentEvent): DeploymentEventsState {
  const logs = event.log ? [...state.logs, event.log] : state.logs
  const status = event.status ?? state.status
  const access = event.access ?? state.access
  const stepFromStatus = status === DeploymentStatus.RUNNING ? DeploymentStep.READY : undefined
  const currentStep =
    stepFromStatus ?? (event.log ? stepFromLog(event.log.message) : undefined) ?? state.currentStep

  return { ...state, logs, status, access, currentStep }
}

const INITIAL_STATE: DeploymentEventsState = {
  logs: [],
  status: DeploymentStatus.PROVISIONING,
  currentStep: DeploymentStep.VALIDATION,
  access: undefined,
  isDone: false,
}

/**
 * Simule le flux SSE `/deployments/{id}/events` (display-only) : émet les events
 * d'EXEMPLE à intervalle régulier, met à jour statut + étape du stepper, append
 * les logs factices et révèle les accès d'exemple au passage « running ».
 *
 * Au branchement (slice de wiring), cette même API publique sera servie par un
 * vrai `EventSource` sur l'endpoint SSE — les composants ne changent pas.
 */
export function useDeploymentEvents(id: string | undefined): UseDeploymentEventsResult {
  const [state, setState] = useState<KeyedState>({ id, progress: INITIAL_STATE })

  useEffect(() => {
    if (id === undefined) {
      return
    }

    // Snapshot local : tout le state est piloté depuis le callback du timer
    // (jamais de setState synchrone en effet). Le cleanup arrête le timer au
    // changement de cible ; la non-concordance d'`id` (ci-dessous) garantit que
    // l'on n'affiche jamais la progression d'une cible précédente.
    let snapshot = INITIAL_STATE
    let index = 0

    const timer = setInterval(() => {
      const event = EXAMPLE_DEPLOYMENT_EVENTS[index]
      if (event === undefined) {
        snapshot = { ...snapshot, isDone: true }
        setState({ id, progress: snapshot })
        clearInterval(timer)
        return
      }
      snapshot = reduceEvent(snapshot, event)
      setState({ id, progress: snapshot })
      index += 1
    }, EVENT_INTERVAL_MS)

    return () => {
      clearInterval(timer)
    }
  }, [id])

  // Tant que la progression stockée ne correspond pas à la cible demandée
  // (changement d'`id`, avant le premier tick), on repart de l'état initial.
  return state.id === id ? state.progress : INITIAL_STATE
}
