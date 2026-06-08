import type { MessageRole } from '../enums/MessageRole'
import type { ActionProposal } from './ActionProposal'

/**
 * Message enrichi pour l'UI. `role` est un enum typé ; un message assistant peut
 * porter une `action` (proposition de confirmation avancée). Les composants
 * reçoivent ce modèle, jamais le DTO. `content` est toujours du texte brut
 * (jamais d'HTML — pas de `dangerouslySetInnerHTML`).
 */
export interface Message {
  id: string
  role: MessageRole
  content: string
  /** Date d'envoi ISO 8601. */
  createdAt: string
  /** Proposition d'action attachée, ou `undefined`. */
  action?: ActionProposal
}
