import type {
  ActionProposedEventDTO,
  ActionResultEventDTO,
  ErrorEventDTO,
  MessageEventDTO,
  TokenEventDTO,
} from '../types/dto/ChatStreamEventDTO'
import type { ConversationDTO } from '../types/dto/ConversationDTO'
import type { MessageDTO } from '../types/dto/MessageDTO'
import { ActionStatus } from '../types/enums/ActionStatus'
import { MessageRole } from '../types/enums/MessageRole'
import { toActionKind, toMessageRole } from '../types/guards/chatGuards'
import type { ActionProposal, ActionRecapEntry } from '../types/models/ActionProposal'
import { ChatStreamEventName, type ChatStreamEvent } from '../types/models/ChatStreamEvent'
import type { Conversation } from '../types/models/Conversation'
import type { Message } from '../types/models/Message'
import { relativeFromNow } from './relativeTime'

/** Mappe un fil API (`ConversationDTO`) vers le modèle UI `Conversation`. */
export function mapConversationDto(dto: ConversationDTO): Conversation {
  const reference = dto.updated_at ?? dto.created_at
  return {
    id: dto.id,
    title: dto.title,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    relativeWhen: reference === null ? "à l'instant" : relativeFromNow(reference),
  }
}

/**
 * Mappe un message REST (`MessageDTO`) vers le modèle UI `Message`. L'API ne porte
 * jamais d'action sur le message : une proposition arrive par l'événement SSE
 * `action_proposed`, attaché au tour assistant côté réducteur (`useChatStream`).
 */
export function mapMessageDto(dto: MessageDTO): Message {
  return {
    id: dto.id,
    role: toMessageRole(dto.role),
    content: dto.content,
    createdAt: dto.created_at ?? new Date().toISOString(),
  }
}

/** Garde de type : la valeur de récap est un objet imbriqué (à déplier). */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Sérialise une valeur scalaire de récap en chaîne affichable. */
function stringifyRecapValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

/**
 * Aplatit le `recap` hétérogène d'une proposition en lignes affichables. Une
 * valeur objet (ex. `params`) est dépliée à plat (ses propres clés deviennent des
 * lignes), pour rester lisible dans la carte sans imbrication.
 */
function flattenRecap(recap: Readonly<Record<string, unknown>>): ActionRecapEntry[] {
  return Object.entries(recap).flatMap(([label, value]) => {
    if (isRecord(value)) {
      return Object.entries(value).map(([nestedLabel, nestedValue]) => ({
        label: nestedLabel,
        value: stringifyRecapValue(nestedValue),
      }))
    }
    return [{ label, value: stringifyRecapValue(value) }]
  })
}

/**
 * Construit une `ActionProposal` UI à partir de l'événement SSE `action_proposed`
 * (`{action_id, kind, restatement, recap}`). Le back ne transmet ni image figée ni
 * `template_id` exploitable côté UI : `image` / `templateId` restent `null`
 * (« Modifier » ouvre alors la config déploiement vierge). La `version`, si
 * présente dans le récap, alimente l'identité affichée.
 */
export function mapActionProposed(dto: ActionProposedEventDTO): ActionProposal {
  const versionValue = dto.recap['version']
  return {
    id: dto.action_id,
    kind: toActionKind(dto.kind),
    status: ActionStatus.PROPOSED,
    intent: dto.restatement,
    templateId: null,
    version: typeof versionValue === 'string' ? versionValue : null,
    image: null,
    params: flattenRecap(dto.recap),
    quotas: [],
  }
}

/** Construit le message assistant figé porté par l'événement SSE `message`. */
function buildAssistantMessage(content: string): Message {
  return {
    id: `assistant-${crypto.randomUUID()}`,
    role: MessageRole.ASSISTANT,
    content,
    createdAt: new Date().toISOString(),
  }
}

/** Normalise le résultat d'action SSE : succès → exécutée, échec → échec. */
function resultStatus(success: boolean): ActionStatus {
  return success ? ActionStatus.EXECUTED : ActionStatus.FAILED
}

/**
 * Mappe une trame SSE brute (`event:` + `data` JSON) vers un `ChatStreamEvent`
 * (union discriminée). Lève sur un nom d'événement inconnu : un contrat futur non
 * géré doit échouer franchement plutôt que de passer silencieusement.
 */
export function mapStreamEvent(eventName: string, data: string): ChatStreamEvent {
  switch (eventName) {
    case ChatStreamEventName.TOKEN: {
      const dto = JSON.parse(data) as TokenEventDTO
      return { type: 'token', delta: dto.delta }
    }
    case ChatStreamEventName.MESSAGE: {
      const dto = JSON.parse(data) as MessageEventDTO
      return { type: 'message', message: buildAssistantMessage(dto.content) }
    }
    case ChatStreamEventName.ACTION_PROPOSED: {
      const dto = JSON.parse(data) as ActionProposedEventDTO
      return { type: 'action_proposed', action: mapActionProposed(dto) }
    }
    case ChatStreamEventName.ACTION_RESULT: {
      const dto = JSON.parse(data) as ActionResultEventDTO
      return {
        type: 'action_result',
        actionId: dto.action_id,
        status: resultStatus(dto.success),
        deploymentId: dto.deployment_id ?? null,
        message: null,
      }
    }
    case ChatStreamEventName.ERROR: {
      const dto = JSON.parse(data) as ErrorEventDTO
      return { type: 'error', message: dto.message }
    }
    default:
      throw new Error(`Événement SSE de chat inconnu : « ${eventName} ».`)
  }
}
