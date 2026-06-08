import type { ActionProposalDTO } from '../types/dto/ActionProposalDTO'
import type {
  ActionProposedEventDTO,
  ActionResultEventDTO,
  ErrorEventDTO,
  MessageEventDTO,
  TokenEventDTO,
} from '../types/dto/ChatStreamEventDTO'
import type { ConversationDTO } from '../types/dto/ConversationDTO'
import type { MessageDTO } from '../types/dto/MessageDTO'
import { toActionKind, toActionStatus, toMessageRole } from '../types/guards/chatGuards'
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
    relativeWhen: relativeFromNow(reference),
  }
}

/** Aplatit un dictionnaire de récap en liste ordonnée (label/valeur). */
function toRecapEntries(record: Readonly<Record<string, string>>): readonly ActionRecapEntry[] {
  return Object.entries(record).map(([label, value]) => ({ label, value }))
}

/** Mappe une proposition d'action (`ActionProposalDTO`) vers le modèle UI. */
export function mapActionProposalDto(dto: ActionProposalDTO): ActionProposal {
  return {
    id: dto.id,
    kind: toActionKind(dto.kind),
    status: toActionStatus(dto.status),
    intent: dto.intent,
    templateId: dto.template_id,
    version: dto.version,
    image: dto.image,
    params: toRecapEntries(dto.params),
    quotas: toRecapEntries(dto.quotas),
  }
}

/** Mappe un message (`MessageDTO`) vers le modèle UI `Message`. */
export function mapMessageDto(dto: MessageDTO): Message {
  return {
    id: dto.id,
    role: toMessageRole(dto.role),
    content: dto.content,
    createdAt: dto.created_at,
    action: dto.action ? mapActionProposalDto(dto.action) : undefined,
  }
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
      return { type: 'message', message: mapMessageDto(dto.message) }
    }
    case ChatStreamEventName.ACTION_PROPOSED: {
      const dto = JSON.parse(data) as ActionProposedEventDTO
      return { type: 'action_proposed', action: mapActionProposalDto(dto.action) }
    }
    case ChatStreamEventName.ACTION_RESULT: {
      const dto = JSON.parse(data) as ActionResultEventDTO
      return {
        type: 'action_result',
        actionId: dto.action_id,
        status: toActionStatus(dto.status),
        deploymentId: dto.deployment_id,
        message: dto.message,
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
