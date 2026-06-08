import type { ActionStatus } from '../enums/ActionStatus'
import type { ActionProposal } from './ActionProposal'
import type { Message } from './Message'

/**
 * Événement de flux SSE enrichi pour l'UI — union discriminée par `type`,
 * réduite par `useChatStream` pour piloter le tour assistant en cours :
 *   - `token`           → accumule un fragment de texte (bulle qui se remplit).
 *   - `message`         → fige le message assistant final.
 *   - `action_proposed` → attache une `ActionProposal` au message (carte).
 *   - `action_result`   → met à jour le statut d'une action après confirmation.
 *   - `error`           → erreur honnête à afficher.
 */

export interface TokenEvent {
  type: 'token'
  /** Fragment à concaténer au message assistant en cours. */
  delta: string
}

export interface MessageEvent {
  type: 'message'
  message: Message
}

export interface ActionProposedEvent {
  type: 'action_proposed'
  action: ActionProposal
}

export interface ActionResultEvent {
  type: 'action_result'
  actionId: string
  status: ActionStatus
  /** Identifiant du déploiement créé (action `deploy`), ou `null`. */
  deploymentId: string | null
  /** Libellé humain du résultat, ou `null`. */
  message: string | null
}

export interface ErrorEvent {
  type: 'error'
  message: string
}

export type ChatStreamEvent =
  | TokenEvent
  | MessageEvent
  | ActionProposedEvent
  | ActionResultEvent
  | ErrorEvent

/** Noms d'événements SSE (champ `event:`), partagés mapper ↔ seam ↔ hook. */
export const ChatStreamEventName = {
  TOKEN: 'token',
  MESSAGE: 'message',
  ACTION_PROPOSED: 'action_proposed',
  ACTION_RESULT: 'action_result',
  ERROR: 'error',
} as const

export type ChatStreamEventName = (typeof ChatStreamEventName)[keyof typeof ChatStreamEventName]
