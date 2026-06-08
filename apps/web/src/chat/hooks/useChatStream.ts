import { useCallback, useEffect, useRef, useState } from 'react'

import { buildActionResultFrame } from '../data/stream.fixtures'
import { mapStreamEvent } from '../mappers/chatMapper'
import { openChatStream } from '../services/chatStreamSeam'
import { ActionStatus } from '../types/enums/ActionStatus'
import { MessageRole } from '../types/enums/MessageRole'
import type { ChatStreamEvent } from '../types/models/ChatStreamEvent'
import type { Message } from '../types/models/Message'

/** État accumulé du tour de conversation en cours, étiqueté par le fil actif. */
interface StreamState {
  /** Messages figés du fil (utilisateur + assistant finalisés). */
  messages: readonly Message[]
  /** Texte de la réponse assistant en cours (buffer de tokens). */
  streamingText: string
  /** Un flux est ouvert (réponse en cours de génération). */
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
  /** Envoie un message utilisateur et ouvre le flux de réponse de l'assistant. */
  send: (content: string) => void
  /**
   * Applique le résultat scripté d'une action confirmée (display-only) : marque
   * l'action « exécutée » et mémorise le déploiement créé. Au branchement, ce
   * résultat arrivera par le flux SSE (`action_result`) et cette méthode disparaîtra.
   */
  applyActionResult: (actionId: string) => void
  /** Marque localement une action comme annulée (rejet utilisateur). */
  rejectActionLocally: (actionId: string) => void
}

/** Applique le statut résultant à l'action portée par un message. */
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
 * Réduit un événement SSE déjà mappé sur l'état accumulé du fil. Générique sur
 * le type d'état (chaque branche spread `...state`) pour préserver l'étiquette
 * `keyedId` portée par l'état interne.
 */
function reduceEvent<S extends StreamState>(state: S, event: ChatStreamEvent): S {
  switch (event.type) {
    case 'token':
      return { ...state, streamingText: state.streamingText + event.delta }
    case 'message':
      return { ...state, messages: [...state.messages, event.message], streamingText: '' }
    case 'action_proposed': {
      const messages = state.messages.map((message, index) =>
        index === state.messages.length - 1 && message.role === MessageRole.ASSISTANT
          ? { ...message, action: event.action }
          : message,
      )
      return { ...state, messages }
    }
    case 'action_result':
      return {
        ...state,
        messages: withActionStatus(state.messages, event.actionId, event.status),
        lastDeploymentId: event.deploymentId ?? state.lastDeploymentId,
      }
    case 'error':
      return { ...state, error: event.message, isStreaming: false }
    default:
      return state
  }
}

/** Construit le message utilisateur local injecté à l'envoi (avant écho back). */
function buildUserMessage(content: string): Message {
  return {
    id: `local-${crypto.randomUUID()}`,
    role: MessageRole.USER,
    content,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Pilote le tour de conversation contre le seam SSE (`openChatStream`), calqué
 * sur le pattern fetch-SSE de `useDeploymentEvents` : un `AbortController` borne
 * la vie du flux (démontage / changement de fil), chaque trame est mappée puis
 * réduite (tokens accumulés, message figé, action proposée puis résolue).
 *
 * En display-only, le seam rejoue des trames scriptées ; au branchement, seul
 * le corps du seam change (ouverture `@microsoft/fetch-event-source` + Bearer).
 */
export function useChatStream(conversationId: string): UseChatStreamResult {
  const [state, setState] = useState<KeyedStreamState>(() => initialState(conversationId))
  const controllerRef = useRef<AbortController | undefined>(undefined)

  // Changement de fil : on repart d'un état vierge pendant le rendu (pattern
  // « ajuster l'état au rendu » de React, sans effet) — un fil n'hérite jamais
  // de la progression d'un autre. L'abandon du flux courant est délégué à
  // l'effet ci-dessous (le ref n'est pas touché pendant le rendu).
  if (state.keyedId !== conversationId) {
    setState(initialState(conversationId))
  }

  const abortCurrent = useCallback((): void => {
    controllerRef.current?.abort()
    controllerRef.current = undefined
  }, [])

  // Abandon du flux quand le fil change (cleanup) ou au démontage : un système
  // externe (la connexion SSE) qu'on synchronise avec le fil courant.
  useEffect(() => abortCurrent, [conversationId, abortCurrent])

  const send = useCallback(
    (content: string): void => {
      const trimmed = content.trim()
      if (trimmed.length === 0) {
        return
      }

      abortCurrent()
      const controller = new AbortController()
      controllerRef.current = controller

      setState((previous) => ({
        ...previous,
        messages: [...previous.messages, buildUserMessage(trimmed)],
        streamingText: '',
        isStreaming: true,
        error: undefined,
      }))

      const onFrame = (frame: { event: string; data: string }): void => {
        const event = mapStreamEvent(frame.event, frame.data)
        setState((previous) => reduceEvent(previous, event))
      }

      void openChatStream(conversationId, trimmed, onFrame, controller.signal).finally(() => {
        if (controllerRef.current === controller) {
          setState((previous) => ({ ...previous, isStreaming: false }))
          controllerRef.current = undefined
        }
      })
    },
    [conversationId, abortCurrent],
  )

  const applyActionResult = useCallback((actionId: string): void => {
    const frame = buildActionResultFrame(actionId)
    const event = mapStreamEvent(frame.event, frame.data)
    setState((previous) => reduceEvent(previous, event))
  }, [])

  const rejectActionLocally = useCallback((actionId: string): void => {
    setState((previous) => ({
      ...previous,
      messages: previous.messages.map((message) =>
        message.action?.id === actionId
          ? { ...message, action: { ...message.action, status: ActionStatus.REJECTED } }
          : message,
      ),
    }))
  }, [])

  return {
    messages: state.messages,
    streamingText: state.streamingText,
    isStreaming: state.isStreaming,
    error: state.error,
    lastDeploymentId: state.lastDeploymentId,
    send,
    applyActionResult,
    rejectActionLocally,
  }
}
