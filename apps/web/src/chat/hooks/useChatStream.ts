import { type EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { useCallback, useEffect, useState } from 'react'

import { apiClient } from '../../core/api/apiClient'
import { refreshAccessToken } from '../../core/api/refreshSession'
import { getAccessToken } from '../../core/api/tokenStore'
import { mapStreamEvent } from '../mappers/chatMapper'
import { sendMessage } from '../services/chatService'
import { ActionStatus } from '../types/enums/ActionStatus'
import { MessageRole } from '../types/enums/MessageRole'
import type { ChatStreamEvent } from '../types/models/ChatStreamEvent'
import type { Message } from '../types/models/Message'

/** Code HTTP signalant un access token absent/expiré sur le flux SSE. */
const UNAUTHORIZED = 401

/** Nombre maximal de refresh + reconnexion sur 401 (borne la boucle de retry). */
const MAX_REFRESH_RETRIES = 1

/** Message d'erreur honnête affiché quand le flux échoue de façon non récupérable. */
const STREAM_ERROR_MESSAGE = 'La connexion au chat a été perdue. Réessaie dans un instant.'

/**
 * Amorce de la bulle assistant qui porte une proposition d'action. La
 * reformulation détaillée (`intent`) est affichée par la carte elle-même : on
 * évite de la dupliquer dans la bulle par ce court intitulé d'introduction.
 */
const ACTION_BUBBLE_LEAD_IN = 'Voici ce que je te propose :'

/** État accumulé du tour de conversation en cours, étiqueté par le fil actif. */
interface StreamState {
  /** Messages figés du fil (utilisateur + assistant finalisés). */
  messages: readonly Message[]
  /** Texte de la réponse assistant en cours (buffer de tokens). */
  streamingText: string
  /** Un flux est ouvert et une réponse est en cours de génération. */
  isStreaming: boolean
  /** Erreur métier honnête remontée par le flux, ou `undefined`. */
  error: string | undefined
  /** Identifiant du dernier déploiement créé par une action confirmée. */
  lastDeploymentId: string | undefined
}

/** État interne : la progression accumulée, étiquetée par le fil courant. */
interface KeyedStreamState extends StreamState {
  /** Fil auquel se rapporte la progression — sert à réinitialiser au changement. */
  keyedId: string
}

const EMPTY_PROGRESS: StreamState = {
  messages: [],
  streamingText: '',
  isStreaming: false,
  error: undefined,
  lastDeploymentId: undefined,
}

function initialState(conversationId: string): KeyedStreamState {
  return { ...EMPTY_PROGRESS, keyedId: conversationId }
}

export interface UseChatStreamResult extends StreamState {
  /** Envoie un message utilisateur (POST 202) ; la réponse arrive par le flux SSE. */
  send: (content: string) => void
  /**
   * Marque localement une action comme « annulée » dès le clic « Annuler » de
   * l'utilisateur (sa propre décision, honnête). Le back republie un
   * `action_result` indistinct d'un échec : ce repère local préserve l'intitulé
   * « Annulée » sans attendre — et le réducteur ne le redégrade jamais.
   */
  rejectActionLocally: (actionId: string) => void
}

/**
 * Erreur interne signalant un 401 sur le flux SSE : l'access token est expiré.
 * On la distingue d'une erreur réseau pour ne déclencher le refresh que sur 401.
 */
class UnauthorizedStreamError extends Error {}

/** Construit le message utilisateur local injecté à l'envoi (avant traitement back). */
function buildUserMessage(content: string): Message {
  return {
    id: `local-${crypto.randomUUID()}`,
    role: MessageRole.USER,
    content,
    createdAt: new Date().toISOString(),
  }
}

/** Applique un statut au message portant l'action ; sans toucher aux autres. */
function withActionStatus(
  messages: readonly Message[],
  actionId: string,
  status: ActionStatus,
): readonly Message[] {
  return messages.map((message) =>
    message.action?.id === actionId
      ? { ...message, action: { ...message.action, status } }
      : message,
  )
}

/**
 * Applique le résultat SSE d'une action au message qui la porte — mais ne
 * redégrade JAMAIS une action déjà « annulée » par l'utilisateur : le back
 * republie un `action_result` (échec indistinct) après un rejet, qu'on ignore ici.
 */
function applyActionResult(
  messages: readonly Message[],
  event: Extract<ChatStreamEvent, { type: 'action_result' }>,
): readonly Message[] {
  return messages.map((message) => {
    if (message.action?.id !== event.actionId) {
      return message
    }
    if (message.action.status === ActionStatus.REJECTED) {
      return message
    }
    return { ...message, action: { ...message.action, status: event.status } }
  })
}

/**
 * Réduit un événement SSE déjà mappé sur l'état accumulé du fil. Générique sur le
 * type d'état (chaque branche spread `...state`) pour préserver l'étiquette
 * `keyedId` portée par l'état interne.
 *
 * `action_proposed` matérialise une nouvelle bulle assistant porteuse de l'action :
 * le back persiste un message assistant = reformulation (`intent`) et n'émet que
 * cet événement (pas de `message` séparé), on reproduit donc fidèlement ce tour.
 */
function reduceEvent<S extends StreamState>(state: S, event: ChatStreamEvent): S {
  switch (event.type) {
    case 'token':
      return { ...state, streamingText: state.streamingText + event.delta }
    case 'message':
      return {
        ...state,
        messages: [...state.messages, event.message],
        streamingText: '',
        isStreaming: false,
      }
    case 'action_proposed': {
      const assistant: Message = {
        id: `assistant-${event.action.id}`,
        role: MessageRole.ASSISTANT,
        content: ACTION_BUBBLE_LEAD_IN,
        createdAt: new Date().toISOString(),
        action: event.action,
      }
      return {
        ...state,
        messages: [...state.messages, assistant],
        streamingText: '',
        isStreaming: false,
      }
    }
    case 'action_result':
      return {
        ...state,
        messages: applyActionResult(state.messages, event),
        lastDeploymentId: event.deploymentId ?? state.lastDeploymentId,
      }
    case 'error':
      return { ...state, error: event.message, isStreaming: false }
    default:
      return state
  }
}

/** Construit l'URL absolue du flux SSE de la conversation à partir de l'apiClient. */
function buildStreamUrl(conversationId: string): string {
  const baseUrl = apiClient.defaults.baseURL ?? ''
  return `${baseUrl}/chat/conversations/${conversationId}/stream`
}

/** En-têtes du flux SSE : l'access token courant en Bearer (lu à chaque ouverture). */
function buildHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Pilote le tour de conversation contre le flux SSE réel
 * `GET /chat/conversations/{id}/stream`, calqué sur `useDeploymentEvents` :
 * ouverture par `fetchEventSource` (header `Authorization: Bearer`, refresh borné
 * sur 401), chaque trame mappée puis réduite (tokens accumulés, message figé,
 * action proposée puis résolue). Le flux reste ouvert tant que le fil est actif :
 * `send` ne fait qu'un `POST .../messages` (202), la réponse arrivant par ce canal.
 * Un `AbortController` borne la vie du flux (changement de fil, démontage).
 */
export function useChatStream(conversationId: string): UseChatStreamResult {
  const [state, setState] = useState<KeyedStreamState>(() => initialState(conversationId))

  useEffect(() => {
    if (conversationId === '') {
      return
    }

    const controller = new AbortController()

    // Repart d'un état vierge au premier event d'un nouveau fil, sans setState
    // synchrone dans l'effet (pattern « état étiqueté » de `useDeploymentEvents`).
    const baseFor = (previous: KeyedStreamState): KeyedStreamState =>
      previous.keyedId === conversationId ? previous : initialState(conversationId)

    const applyEvent = (message: EventSourceMessage): void => {
      const event = mapStreamEvent(message.event, message.data)
      setState((previous) => reduceEvent(baseFor(previous), event))
    }

    const markError = (): void => {
      setState((previous) => ({
        ...baseFor(previous),
        error: STREAM_ERROR_MESSAGE,
        isStreaming: false,
      }))
    }

    /** Ouvre le flux SSE ; la promesse rejette sur toute erreur (401, réseau). */
    const openStream = (): Promise<void> =>
      fetchEventSource(buildStreamUrl(conversationId), {
        signal: controller.signal,
        headers: buildHeaders(),
        // Une réponse peut être longue : on ne coupe pas si l'onglet passe caché.
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
  }, [conversationId])

  const send = useCallback(
    (content: string): void => {
      const trimmed = content.trim()
      if (trimmed.length === 0 || conversationId === '') {
        return
      }

      setState((previous) => {
        const base = previous.keyedId === conversationId ? previous : initialState(conversationId)
        return {
          ...base,
          messages: [...base.messages, buildUserMessage(trimmed)],
          streamingText: '',
          isStreaming: true,
          error: undefined,
        }
      })

      void sendMessage(conversationId, trimmed).catch(() => {
        setState((previous) =>
          previous.keyedId === conversationId
            ? { ...previous, isStreaming: false, error: STREAM_ERROR_MESSAGE }
            : previous,
        )
      })
    },
    [conversationId],
  )

  const rejectActionLocally = useCallback(
    (actionId: string): void => {
      setState((previous) =>
        previous.keyedId === conversationId
          ? {
              ...previous,
              messages: withActionStatus(previous.messages, actionId, ActionStatus.REJECTED),
            }
          : previous,
      )
    },
    [conversationId],
  )

  // Tant que la progression stockée ne correspond pas au fil demandé (changement
  // d'id, avant la réinitialisation par l'effet), on expose un état vierge.
  const progress = state.keyedId === conversationId ? state : initialState(conversationId)

  return {
    messages: progress.messages,
    streamingText: progress.streamingText,
    isStreaming: progress.isStreaming,
    error: progress.error,
    lastDeploymentId: progress.lastDeploymentId,
    send,
    rejectActionLocally,
  }
}
