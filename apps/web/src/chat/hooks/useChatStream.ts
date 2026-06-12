import { type EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { apiClient } from '../../core/api/apiClient'
import { refreshAccessToken } from '../../core/api/refreshSession'
import { getAccessToken } from '../../core/api/tokenStore'
import { mapStreamEvent } from '../mappers/chatMapper'
import { CHAT_QUERY_KEYS } from './chatQueryKeys'
import { sendMessage } from '../services/chatService'
import { ActionStatus } from '../types/enums/ActionStatus'
import { MessageRole } from '../types/enums/MessageRole'
import type { ChatStreamEvent } from '../types/models/ChatStreamEvent'
import type { Conversation } from '../types/models/Conversation'
import type {
  ChatErrorKind,
  ChatStreamError,
  ChatStreamState,
  ChatStreamStatus,
} from '../types/models/ChatStreamState'
import type { Message } from '../types/models/Message'

/** Code HTTP signalant un access token absent/expiré sur le flux SSE. */
const UNAUTHORIZED = 401

/** Nombre maximal de refresh + reconnexion sur 401 (borne la boucle de retry). */
const MAX_REFRESH_RETRIES = 1

/** Nombre maximal de reconnexions réseau bornées avant de basculer en erreur (B4). */
const MAX_RECONNECT_ATTEMPTS = 4

/** Délai de base du backoff exponentiel borné entre deux reconnexions (ms). */
const RECONNECT_BASE_DELAY_MS = 1000

/** Plafond du backoff exponentiel : au-delà, on garde un délai constant (ms). */
const RECONNECT_MAX_DELAY_MS = 8000

/** Messages d'erreur honnêtes affichés selon la catégorie d'échec du tour. */
const ERROR_MESSAGES: Record<ChatErrorKind, string> = {
  network: 'La connexion au chat a été perdue. Réessaie dans un instant.',
  timeout: "L'assistant met trop de temps à répondre. Réessaie dans un instant.",
  business: "L'assistant n'a pas pu traiter ta demande.",
  auth: 'Ta session a expiré. Reconnecte-toi pour continuer.',
  unknown: 'Une erreur inattendue est survenue. Réessaie dans un instant.',
}

/**
 * Amorce de la bulle assistant qui porte une proposition d'action. La
 * reformulation détaillée (`intent`) est affichée par la carte elle-même : on
 * évite de la dupliquer dans la bulle par ce court intitulé d'introduction.
 */
const ACTION_BUBBLE_LEAD_IN = 'Voici ce que je te propose :'

/** Statuts où l'envoi d'un nouveau message est autorisé (verrou E2). */
const SENDABLE_STATUSES: ReadonlySet<ChatStreamStatus> = new Set<ChatStreamStatus>([
  'idle',
  'done',
  'error',
])

export interface UseChatStreamResult {
  /** État riche du tour courant (contrat : status, streamingText, error, isReconnecting). */
  state: ChatStreamState
  /** Messages figés du fil (utilisateur + assistant finalisés). */
  messages: readonly Message[]
  /** Identifiant du dernier déploiement créé par une action confirmée. */
  lastDeploymentId: string | undefined
  /** Envoie un message utilisateur (POST 202) ; la réponse arrive par le flux SSE. */
  send: (content: string) => void
  /** Abandonne la génération en cours (AbortController) et repasse au repos. */
  stop: () => void
  /** Réémet le dernier message utilisateur (après une erreur, sans le retaper). */
  retry: () => void
  /** `false` pendant `thinking`/`streaming` : verrouille l'envoi (E2). */
  canSend: boolean
  /**
   * Marque localement une action comme « annulée » dès le clic « Annuler » de
   * l'utilisateur (sa propre décision, honnête). Le back republie un
   * `action_result` indistinct d'un échec : ce repère local préserve l'intitulé
   * « Annulée » sans attendre — et le réducteur ne le redégrade jamais.
   */
  rejectActionLocally: (actionId: string) => void
}

/** État accumulé du tour de conversation en cours, étiqueté par le fil actif. */
interface StreamState extends ChatStreamState {
  /** Messages figés du fil (utilisateur + assistant finalisés). */
  messages: readonly Message[]
  /** Identifiant du dernier déploiement créé par une action confirmée. */
  lastDeploymentId: string | undefined
  /** Dernier message utilisateur envoyé — réémis tel quel par `retry` (B2). */
  lastUserContent: string | undefined
}

/** État interne : la progression accumulée, étiquetée par le fil courant. */
interface KeyedStreamState extends StreamState {
  /** Fil auquel se rapporte la progression — sert à réinitialiser au changement. */
  keyedId: string
}

const EMPTY_PROGRESS: StreamState = {
  status: 'idle',
  streamingText: '',
  error: null,
  isReconnecting: false,
  messages: [],
  lastDeploymentId: undefined,
  lastUserContent: undefined,
}

function initialState(conversationId: string): KeyedStreamState {
  return { ...EMPTY_PROGRESS, keyedId: conversationId }
}

/** Construit une erreur typée à partir de sa catégorie (message honnête associé). */
function buildError(kind: ChatErrorKind, message?: string): ChatStreamError {
  return { kind, message: message ?? ERROR_MESSAGES[kind] }
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
    // On rattache la ressource créée à l'action elle-même : la carte affiche
    // alors un CTA contextuel (« Voir le déploiement → » ou « Voir la stack → »),
    // distinct de l'état global du tour.
    return {
      ...message,
      action: {
        ...message.action,
        status: event.status,
        deploymentId: event.deploymentId ?? message.action.deploymentId ?? null,
        stackId: event.stackId ?? message.action.stackId ?? null,
      },
    }
  })
}

/**
 * Fusionne les messages figés du tour live dans la liste d'amorce mise en cache
 * (React Query), de sorte qu'ils survivent au démontage de la page (Fix 3 : la
 * carte de proposition ne disparaît plus lors d'une navigation interne). On met à
 * jour par `id` les messages déjà présents (ex. statut d'action) et on ajoute les
 * nouveaux à la suite, sans jamais retirer un message d'amorce REST. Renvoie la
 * référence d'entrée inchangée si rien ne bouge (évite un re-render parasite).
 */
function mergeLiveMessages(
  seed: readonly Message[] | undefined,
  live: readonly Message[],
): readonly Message[] | undefined {
  if (live.length === 0) {
    return seed
  }
  const base = seed ?? []
  const liveById = new Map(live.map((message) => [message.id, message]))
  const merged = base.map((message) => liveById.get(message.id) ?? message)
  const knownIds = new Set(base.map((message) => message.id))
  const appended = live.filter((message) => !knownIds.has(message.id))
  if (appended.length === 0 && merged.every((message, index) => message === base[index])) {
    return seed
  }
  return [...merged, ...appended]
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
 * Réduit un événement SSE déjà mappé sur l'état accumulé du fil. `token` fait
 * basculer en `streaming` (la bulle se remplit) ; `message`/`action_proposed`
 * figent le tour en `done` ; `error` porte une erreur métier honnête (`business`).
 */
function reduceEvent(state: KeyedStreamState, event: ChatStreamEvent): KeyedStreamState {
  switch (event.type) {
    case 'token':
      return { ...state, status: 'streaming', streamingText: state.streamingText + event.delta }
    case 'message':
      return {
        ...state,
        status: 'done',
        messages: [...state.messages, event.message],
        streamingText: '',
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
        status: 'done',
        messages: [...state.messages, assistant],
        streamingText: '',
      }
    }
    case 'action_result':
      return {
        ...state,
        messages: applyActionResult(state.messages, event),
        lastDeploymentId: event.deploymentId ?? state.lastDeploymentId,
      }
    case 'error':
      return { ...state, status: 'error', error: buildError('business', event.message) }
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

/** Délai de backoff exponentiel borné pour la n-ième tentative de reconnexion. */
function backoffDelay(attempt: number): number {
  return Math.min(RECONNECT_BASE_DELAY_MS * 2 ** attempt, RECONNECT_MAX_DELAY_MS)
}

/** Porte d'ouverture résoluble manuellement : réveille `send` à l'ouverture (E1). */
interface OpenGate {
  promise: Promise<void>
  resolve: () => void
}

function createOpenGate(): OpenGate {
  let resolve = (): void => undefined
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

/**
 * Pilote le tour de conversation contre le flux SSE réel
 * `GET /chat/conversations/{id}/stream`, calqué sur `useDeploymentEvents` mais doté
 * d'une machine d'état riche (`ChatStreamState`) et d'une résilience renforcée :
 *
 *   - **E1 (course)** : `send` attend l'ouverture effective du flux (`onopen` 200)
 *     avant d'émettre le `POST .../messages`, pour ne jamais perdre la réponse d'un
 *     fil neuf dont le canal n'était pas encore abonné.
 *   - **B4 (reconnexion)** : sur coupure réseau, reconnexion avec backoff borné
 *     (`isReconnecting`), avant de basculer en `error{kind:'network'}`.
 *   - **A3 (stop)** : abandonne le flux courant et le rouvre frais (toujours abonné).
 *   - **401** : refresh borné puis réouverture avec le nouveau Bearer (`auth` si épuisé).
 */
export function useChatStream(conversationId: string): UseChatStreamResult {
  const queryClient = useQueryClient()
  const [state, setState] = useState<KeyedStreamState>(() => initialState(conversationId))
  // Bump pour rouvrir un flux frais sans changer de fil (stop, redémarrage manuel).
  const [connectionNonce, setConnectionNonce] = useState(0)
  // Porte d'ouverture du flux courant : `send` l'attend avant de poster (E1).
  const openGateRef = useRef<OpenGate>(createOpenGate())

  useEffect(() => {
    if (conversationId === '') {
      return
    }

    const controller = new AbortController()
    const gate = createOpenGate()
    openGateRef.current = gate

    // Repart d'un état vierge au premier event d'un nouveau fil, sans setState
    // synchrone dans l'effet (pattern « état étiqueté » de `useDeploymentEvents`).
    const baseFor = (previous: KeyedStreamState): KeyedStreamState =>
      previous.keyedId === conversationId ? previous : initialState(conversationId)

    const applyEvent = (message: EventSourceMessage): void => {
      const event = mapStreamEvent(message.event, message.data)
      // Le titre auto (1er message) ne touche pas l'état du tour : il met à jour le
      // libellé du fil dans la sidebar. On patche DIRECTEMENT le cache avec le titre
      // de l'event (pas d'invalidation/refetch) : le back publie l'event AVANT le
      // commit de sa transaction, donc un refetch immédiat relirait l'ancien titre.
      if (event.type === 'title') {
        queryClient.setQueryData<readonly Conversation[]>(CHAT_QUERY_KEYS.conversations, (fils) =>
          fils?.map((fil) => (fil.id === conversationId ? { ...fil, title: event.title } : fil)),
        )
      }
      setState((previous) => reduceEvent(baseFor(previous), event))
    }

    const markConnected = (): void => {
      gate.resolve()
      setState((previous) => ({ ...baseFor(previous), isReconnecting: false }))
    }

    const markReconnecting = (): void => {
      setState((previous) => ({ ...baseFor(previous), isReconnecting: true }))
    }

    const failWith = (kind: ChatErrorKind): void => {
      setState((previous) => ({
        ...baseFor(previous),
        status: 'error',
        isReconnecting: false,
        error: buildError(kind),
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
          markConnected()
          return Promise.resolve()
        },
        onmessage: applyEvent,
        // On désactive le retry intégré de la lib (qui rejouerait avec l'ancien
        // Bearer) : toute erreur fait rejeter la promesse, qu'on gère ici-même.
        onerror: (error) => {
          throw error
        },
      })

    /** Attend `delay` ms, résolu d'office si le flux est abandonné entre-temps. */
    const wait = (delay: number): Promise<void> =>
      new Promise((resolve) => {
        const timer = setTimeout(resolve, delay)
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timer)
          resolve()
        })
      })

    const handleUnauthorized = async (refreshes: number, reconnects: number): Promise<void> => {
      if (refreshes <= 0) {
        failWith('auth')
        return
      }
      try {
        await refreshAccessToken(apiClient)
      } catch {
        failWith('auth')
        return
      }
      await run(refreshes - 1, reconnects)
    }

    const handleNetworkError = async (reconnects: number): Promise<void> => {
      if (reconnects <= 0) {
        failWith('network')
        return
      }
      markReconnecting()
      await wait(backoffDelay(MAX_RECONNECT_ATTEMPTS - reconnects))
      if (controller.signal.aborted) {
        return
      }
      await run(MAX_REFRESH_RETRIES, reconnects - 1)
    }

    /**
     * Boucle d'ouverture résiliente : refresh borné sur 401, reconnexion bornée
     * avec backoff sur coupure réseau. `refreshes`/`reconnects` bornent chaque voie.
     */
    async function run(refreshes: number, reconnects: number): Promise<void> {
      try {
        await openStream()
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        if (error instanceof UnauthorizedStreamError) {
          await handleUnauthorized(refreshes, reconnects)
          return
        }
        await handleNetworkError(reconnects)
      }
    }

    void run(MAX_REFRESH_RETRIES, MAX_RECONNECT_ATTEMPTS)

    return () => {
      controller.abort()
    }
  }, [conversationId, connectionNonce, queryClient])

  /** Lance le POST d'envoi après ouverture du flux (E1) ; échec → erreur réseau (B3). */
  const postWhenReady = useCallback(
    async (content: string): Promise<void> => {
      await openGateRef.current.promise
      try {
        await sendMessage(conversationId, content)
      } catch {
        setState((previous) =>
          previous.keyedId === conversationId
            ? { ...previous, status: 'error', error: buildError('network') }
            : previous,
        )
      }
    },
    [conversationId],
  )

  const send = useCallback(
    (content: string): void => {
      const trimmed = content.trim()
      if (trimmed.length === 0 || conversationId === '') {
        return
      }

      setState((previous) => {
        const base = previous.keyedId === conversationId ? previous : initialState(conversationId)
        if (!SENDABLE_STATUSES.has(base.status)) {
          return previous
        }
        void postWhenReady(trimmed)
        return {
          ...base,
          status: 'thinking',
          streamingText: '',
          error: null,
          messages: [...base.messages, buildUserMessage(trimmed)],
          lastUserContent: trimmed,
        }
      })
    },
    [conversationId, postWhenReady],
  )

  const retry = useCallback((): void => {
    setState((previous) => {
      if (previous.keyedId !== conversationId || previous.lastUserContent === undefined) {
        return previous
      }
      void postWhenReady(previous.lastUserContent)
      return { ...previous, status: 'thinking', streamingText: '', error: null }
    })
  }, [conversationId, postWhenReady])

  const stop = useCallback((): void => {
    setState((previous) =>
      previous.keyedId === conversationId
        ? { ...previous, status: 'done', streamingText: '' }
        : previous,
    )
    // Rouvre un flux frais : on abandonne la génération mais reste abonné au fil.
    setConnectionNonce((nonce) => nonce + 1)
  }, [conversationId])

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

  // Fix 3 — persistance de la proposition au changement de page. Les messages
  // figés du tour vivent dans un `useState` local, perdu au démontage de la page
  // (navigation SPA interne). On les miroite donc dans le cache des messages du fil
  // (`useConversation`) : au remontage, ils sont déjà servis depuis le cache, sans
  // disparition ni nouvel event SSE. On patche DIRECTEMENT le cache (pas
  // d'invalidation) — comme pour le titre auto — car le back peut ne pas avoir
  // encore persisté la proposition. La fusion par `id` préserve l'amorce REST.
  useEffect(() => {
    if (conversationId === '' || state.keyedId !== conversationId || state.messages.length === 0) {
      return
    }
    queryClient.setQueryData<readonly Message[]>(
      CHAT_QUERY_KEYS.conversationMessages(conversationId),
      (seed) => mergeLiveMessages(seed, state.messages),
    )
  }, [conversationId, queryClient, state.keyedId, state.messages])

  // Tant que la progression stockée ne correspond pas au fil demandé (changement
  // d'id, avant la réinitialisation par l'effet), on expose un état vierge.
  const progress = state.keyedId === conversationId ? state : initialState(conversationId)
  const canSend = SENDABLE_STATUSES.has(progress.status)

  return {
    state: {
      status: progress.status,
      streamingText: progress.streamingText,
      error: progress.error,
      isReconnecting: progress.isReconnecting,
    },
    messages: progress.messages,
    lastDeploymentId: progress.lastDeploymentId,
    send,
    stop,
    retry,
    canSend,
    rejectActionLocally,
  }
}
