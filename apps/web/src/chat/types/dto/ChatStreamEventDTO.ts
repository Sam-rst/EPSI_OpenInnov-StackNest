import type { ActionProposalDTO } from './ActionProposalDTO'
import type { MessageDTO } from './MessageDTO'

/**
 * Miroir EXACT des trames du flux SSE `GET /chat/conversations/{id}/stream`.
 *
 * Chaque trame est un événement nommé (`event:` SSE) au `data` JSON typé :
 *   - `token`           → fragment de texte de la réponse en cours (streaming).
 *   - `message`         → message assistant finalisé (remplace le buffer de tokens).
 *   - `action_proposed` → proposition d'action (déclenche la carte de confirmation).
 *   - `action_result`   → résultat d'exécution d'une action confirmée.
 *   - `error`           → erreur métier honnête (affichée à l'utilisateur).
 *
 * Le mapper transforme ces DTO bruts en `ChatStreamEvent` (union discriminée UI).
 */

/** Fragment de texte de la réponse assistant en cours de génération. */
export interface TokenEventDTO {
  /** Fragment à concaténer au message assistant en cours. */
  delta: string
}

/** Message assistant finalisé (clôt le streaming du tour courant). */
export interface MessageEventDTO {
  message: MessageDTO
}

/** Proposition d'action (confirmation avancée) émise par l'assistant. */
export interface ActionProposedEventDTO {
  action: ActionProposalDTO
}

/** Résultat d'exécution d'une action confirmée (statut brut + message). */
export interface ActionResultEventDTO {
  action_id: string
  /** Statut brut résultant (`executed` / `failed`). */
  status: string
  /** Identifiant du déploiement créé (action `deploy`), ou `null`. */
  deployment_id: string | null
  /** Libellé humain du résultat, ou `null`. */
  message: string | null
}

/** Erreur métier honnête remontée dans le flux. */
export interface ErrorEventDTO {
  message: string
}
