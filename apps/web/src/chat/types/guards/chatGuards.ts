import { ActionKind } from '../enums/ActionKind'
import { ActionStatus } from '../enums/ActionStatus'
import { MessageRole } from '../enums/MessageRole'

const ROLE_VALUES: ReadonlySet<string> = new Set(Object.values(MessageRole))
const ACTION_KIND_VALUES: ReadonlySet<string> = new Set(Object.values(ActionKind))
const ACTION_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(ActionStatus))

/** Garde de type : la valeur brute est un `MessageRole` connu. */
export function isMessageRole(value: string): value is MessageRole {
  return ROLE_VALUES.has(value)
}

/** Garde de type : la valeur brute est un `ActionKind` connu. */
export function isActionKind(value: string): value is ActionKind {
  return ACTION_KIND_VALUES.has(value)
}

/** Garde de type : la valeur brute est un `ActionStatus` connu. */
export function isActionStatus(value: string): value is ActionStatus {
  return ACTION_STATUS_VALUES.has(value)
}

/**
 * Normalise un rôle brut en `MessageRole`, avec repli sur `ASSISTANT`.
 * Un rôle inconnu (contrat futur) est traité comme un tour assistant neutre.
 */
export function toMessageRole(value: string): MessageRole {
  return isMessageRole(value) ? value : MessageRole.ASSISTANT
}

/**
 * Normalise une nature d'action brute en `ActionKind`, avec repli sur `DEPLOY`.
 * Le parcours de référence du MVP est le déploiement guidé.
 */
export function toActionKind(value: string): ActionKind {
  return isActionKind(value) ? value : ActionKind.DEPLOY
}

/**
 * Normalise un statut d'action brut en `ActionStatus`, avec repli sur `PROPOSED`.
 * Un statut inconnu est traité comme une proposition en attente de décision.
 */
export function toActionStatus(value: string): ActionStatus {
  return isActionStatus(value) ? value : ActionStatus.PROPOSED
}
