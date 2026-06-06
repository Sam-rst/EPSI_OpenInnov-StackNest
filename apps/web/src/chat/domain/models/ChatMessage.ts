/** Auteur d'un message dans la conversation ChatOps. */
export type ChatRole = 'user' | 'assistant'

/** Nature du contenu d'un message. */
export type ChatMessageKind = 'text' | 'plan'

/** Étape d'un plan de provisionnement proposé par l'assistant. */
export interface ChatPlanItem {
  /** Nom d'icône lucide kebab-case (ex. « database »). */
  icon: string
  /** Libellé de la ressource (ex. « PostgreSQL 16 »). */
  name: string
  /** Spécification courte (ex. « small · 1 vCPU · 2 GB »). */
  spec: string
}

interface BaseChatMessage {
  /** Identifiant stable du message (clé de rendu). */
  id: string
  role: ChatRole
}

/** Message textuel (question utilisateur ou réponse en langage naturel). */
export interface ChatTextMessage extends BaseChatMessage {
  kind: 'text'
  text: string
}

/** Message « plan » : proposition structurée de ressources à provisionner. */
export interface ChatPlanMessage extends BaseChatMessage {
  kind: 'plan'
  items: readonly ChatPlanItem[]
  /** Coût estimé en euros par mois. */
  monthlyCost: number
  /** Estimation de temps de provisionnement (ex. « ~ 35 s »). */
  estimatedTime: string
}

/**
 * Message d'une conversation ChatOps.
 *
 * Mirror UI du contrat ChatOps à venir : aucune donnée n'est fabriquée côté
 * front. La liste reste vide tant que le backend (LLM + orchestration) n'est
 * pas branché via le seam `chatService`.
 */
export type ChatMessage = ChatTextMessage | ChatPlanMessage
