/**
 * Miroir EXACT des trames du flux SSE `GET /chat/conversations/{id}/stream`.
 *
 * Chaque trame est un événement nommé (`event:` SSE) au `data` JSON typé, calqué
 * sur les payloads publiés par le back (`SendMessage` / `ConfirmAction` /
 * `RejectAction`) :
 *   - `token`           → `{delta}` fragment de texte de la réponse en cours.
 *   - `message`         → `{content}` message assistant finalisé (texte seul).
 *   - `action_proposed` → `{action_id, kind, restatement, recap}` proposition.
 *   - `action_result`   → `{action_id, kind, success, deployment_id}` résultat.
 *   - `error`           → `{message}` erreur métier honnête.
 *
 * Le mapper transforme ces DTO bruts en `ChatStreamEvent` (union discriminée UI).
 */

/** Fragment de texte de la réponse assistant en cours de génération. */
export interface TokenEventDTO {
  /** Fragment à concaténer au message assistant en cours. */
  delta: string
}

/** Message assistant finalisé (texte seul ; clôt le streaming du tour courant). */
export interface MessageEventDTO {
  /** Contenu textuel complet du message assistant. */
  content: string
}

/**
 * Proposition d'action (confirmation avancée) émise par l'assistant.
 *
 * `recap` est un dictionnaire hétérogène construit côté gate : pour un déploiement
 * `{template, version, name, params}` (où `params` est lui-même un objet), pour le
 * cycle de vie `{deployment, status}`. Le mapper l'aplatit en lignes affichables.
 */
export interface ActionProposedEventDTO {
  action_id: string
  /** Nature brute de l'action (`deploy` / `stop` / `start` / `regenerate`). */
  kind: string
  /** Reformulation de l'intention détectée, en français. */
  restatement: string
  /** Récapitulatif clé → valeur (valeurs scalaires ou objets imbriqués). */
  recap: Readonly<Record<string, unknown>>
}

/** Résultat d'exécution d'une action confirmée (succès booléen). */
export interface ActionResultEventDTO {
  action_id: string
  /** Nature brute de l'action (`deploy` / `stop` / … / `compose_stack`). */
  kind: string
  /** `true` si la délégation (déploiement ou composition) a réussi, `false` sinon. */
  success: boolean
  /** Identifiant du déploiement créé (action `deploy` réussie), ou `null`. */
  deployment_id?: string | null
  /** Identifiant de la stack créée (action `compose_stack` réussie), ou `null`. */
  stack_id?: string | null
}

/** Erreur métier honnête remontée dans le flux. */
export interface ErrorEventDTO {
  message: string
}

/** Titre auto du fil, généré par le LLM au 1er message (émis une fois). */
export interface TitleEventDTO {
  /** Libellé court résumant la demande (déjà nettoyé côté back). */
  title: string
}
