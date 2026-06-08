import { useCallback, useEffect, useRef, useState } from 'react'

import { mapStreamEvent } from '../mappers/chatMapper'
import { openChatStream } from '../services/chatStreamSeam'
import type { ActionStatus } from '../types/enums/ActionStatus'
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

const INITIAL_STATE: StreamState = {
  messages: [],
  streamingText: '',
  isStreaming: false,
  error: undefined,
  lastDeploymentId: undefined,
}

export interface UseChatStreamResult extends StreamState {
  /** Envoie un message utilisateur et ouvre le flux de réponse de l'assistant. */
  send: (content: string) => void
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

/** Réduit un événement SSE déjà mappé sur l'état accumulé du fil. */
function reduceEvent(state: StreamState, event: ChatStreamEvent): StreamState {
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
  const [state, setState] = useState<StreamState>(INITIAL_STATE)
  const controllerRef = useRef<AbortController | undefined>(undefined)

  const abortCurrent = useCallback((): void => {
    controllerRef.current?.abort()
    controllerRef.current = undefined
  }, [])

  // Changement de fil (ou démontage) : on abandonne le flux courant et on repart
  // d'un état vierge — un fil n'hérite jamais de la progression d'un autre.
  useEffect(() => {
    setState(INITIAL_STATE)
    return () => {
      abortCurrent()
    }
  }, [conversationId, abortCurrent])

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

  return { ...state, send }
}
