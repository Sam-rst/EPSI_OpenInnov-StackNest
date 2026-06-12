import type {
  ActionProposedEventDTO,
  ActionResultEventDTO,
  ErrorEventDTO,
  MessageEventDTO,
  TitleEventDTO,
  TokenEventDTO,
} from '../types/dto/ChatStreamEventDTO'
import type { ConversationDTO } from '../types/dto/ConversationDTO'
import type { MessageDTO } from '../types/dto/MessageDTO'
import { ActionKind } from '../types/enums/ActionKind'
import { ActionStatus } from '../types/enums/ActionStatus'
import { MessageRole } from '../types/enums/MessageRole'
import { toActionKind, toMessageRole } from '../types/guards/chatGuards'
import type {
  ActionProposal,
  ActionRecapEntry,
  StackLinkRecap,
  StackServiceRecap,
} from '../types/models/ActionProposal'
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
 * Mappe un message REST (`MessageDTO`) vers le modèle UI `Message`. Un message
 * assistant peut porter une proposition encore `proposed` (`dto.action`) : on la
 * reconstruit en `ActionProposal` via `mapActionProposed` (même logique que
 * l'événement SSE `action_proposed`), pour rejouer la carte au rechargement du
 * fil. Pendant un tour live, la proposition arrive plutôt par le flux SSE et est
 * attachée par le réducteur de `useChatStream`.
 */
export function mapMessageDto(dto: MessageDTO): Message {
  const action = dto.action != null ? mapActionProposed(dto.action) : undefined
  return {
    id: dto.id,
    role: toMessageRole(dto.role),
    content: dto.content,
    createdAt: dto.created_at ?? new Date().toISOString(),
    ...(action !== undefined && { action }),
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

/** Extrait les services d'une composition de stack depuis le récap typé. */
function parseStackServices(recap: Readonly<Record<string, unknown>>): StackServiceRecap[] {
  const raw = recap['services']
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.flatMap((entry) =>
    isRecord(entry)
      ? [
          {
            alias: stringifyRecapValue(entry['alias']),
            version: stringifyRecapValue(entry['version']),
          },
        ]
      : [],
  )
}

/** Extrait les liens de câblage d'une composition de stack depuis le récap typé. */
function parseStackLinks(recap: Readonly<Record<string, unknown>>): StackLinkRecap[] {
  const raw = recap['links']
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.flatMap((entry) =>
    isRecord(entry)
      ? [{ from: stringifyRecapValue(entry['from']), to: stringifyRecapValue(entry['to']) }]
      : [],
  )
}

/**
 * Construit une `ActionProposal` UI à partir de l'événement SSE `action_proposed`
 * (`{action_id, kind, restatement, recap}`). Le back ne transmet ni image figée ni
 * `template_id` exploitable côté UI : `image` / `templateId` restent `null`
 * (« Modifier » ouvre alors la config déploiement vierge). La `version`, si
 * présente dans le récap, alimente l'identité affichée.
 *
 * Pour une composition de stack (`compose_stack`), le récap est structuré
 * (`{name, services:[{alias, version}], links:[{from, to}]}`) : on l'expose en
 * `stackServices` / `stackLinks` (la carte affiche le câblage), sans aplatir les
 * tableaux en lignes clé/valeur.
 */
export function mapActionProposed(dto: ActionProposedEventDTO): ActionProposal {
  const kind = toActionKind(dto.kind)
  if (kind === ActionKind.COMPOSE_STACK) {
    return {
      id: dto.action_id,
      kind,
      status: ActionStatus.PROPOSED,
      intent: dto.restatement,
      templateId: null,
      version: null,
      image: null,
      params: [],
      quotas: [],
      stackServices: parseStackServices(dto.recap),
      stackLinks: parseStackLinks(dto.recap),
    }
  }
  const versionValue = dto.recap['version']
  return {
    id: dto.action_id,
    kind,
    status: ActionStatus.PROPOSED,
    intent: dto.restatement,
    templateId: null,
    version: typeof versionValue === 'string' ? versionValue : null,
    image: null,
    params: flattenRecap(dto.recap),
    quotas: [],
    stackServices: [],
    stackLinks: [],
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
 * (union discriminée).
 *
 * Une trame au nom d'événement vide est un **keepalive** : le serveur insère un
 * commentaire SSE inerte (`: keepalive`) toutes les ~15 s pendant le silence du
 * LLM, et `@microsoft/fetch-event-source` dispatche un message vide sur la ligne
 * blanche qui le termine. On la traite en no-op — sans ça, chaque heartbeat
 * lèverait et couperait le flux (« Connexion interrompue ») dès que le LLM met
 * plus de 15 s à répondre. Un nom d'événement NON vide mais inconnu lève
 * toujours : un contrat futur non géré doit échouer franchement.
 */
export function mapStreamEvent(eventName: string, data: string): ChatStreamEvent {
  if (eventName === '') {
    return { type: 'keepalive' }
  }
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
        stackId: dto.stack_id ?? null,
        message: null,
      }
    }
    case ChatStreamEventName.ERROR: {
      const dto = JSON.parse(data) as ErrorEventDTO
      return { type: 'error', message: dto.message }
    }
    case ChatStreamEventName.TITLE: {
      const dto = JSON.parse(data) as TitleEventDTO
      return { type: 'title', title: dto.title }
    }
    default:
      throw new Error(`Événement SSE de chat inconnu : « ${eventName} ».`)
  }
}
