/**
 * Miroir EXACT d'une proposition d'action portée par un message assistant
 * (confirmation avancée). Présent dans la trame SSE `action_proposed` et dans
 * le `MessageDTO` rejoué à l'ouverture d'un fil.
 *
 * `kind` / `status` sont des valeurs brutes (normalisées en enums par le mapper).
 * `template_id` / `version` permettent à « Modifier » de préremplir la config
 * déploiement (`/deployments/config?template=...`). `params` et `quotas`
 * matérialisent le récap montré à l'utilisateur avant confirmation.
 */
export interface ActionProposalDTO {
  id: string
  /** Nature brute de l'action (`deploy` / `stop` / `start` / `regenerate`). */
  kind: string
  /** Statut brut de l'action (`proposed` / `confirmed` / …). */
  status: string
  /** Reformulation de l'intention détectée, en français. */
  intent: string
  /** Template du catalogue ciblé, ou `null` (actions sans template). */
  template_id: string | null
  /** Version d'image figée, ou `null`. */
  version: string | null
  /** Image Docker figée (digest/tag), ou `null`. */
  image: string | null
  /** Paramètres récapitulés (clé → valeur affichée). */
  params: Readonly<Record<string, string>>
  /** Quotas/limites récapitulés (ex. « CPU » → « 1 vCPU »). */
  quotas: Readonly<Record<string, string>>
}
