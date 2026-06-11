/**
 * Miroir EXACT des réponses REST `/stacks` (lot 2). Sert deux vues :
 *   - résumé (création 201, liste `GET /stacks`) : `services`/`links` absents/vides ;
 *   - détail (`GET /stacks/{id}`) : `services[]` + `links[]` peuplés.
 *
 * Invariant de sécurité (cf. design § Sécurité) : aucun secret n'y figure. Les
 * params de type `secret` des services sont **masqués** côté API (`••••••••`),
 * et les `var_mappings` des liens ne sont que des expressions résolues
 * worker-side.
 */
export interface StackDTO {
  id: string
  owner_id: string
  name: string
  /** Valeur brute de l'enum `stack_status`. */
  status: string
  /** Services de la stack (peuplé au détail uniquement). */
  services?: StackServiceDTO[]
  /** Liens dirigés entre services (peuplé au détail uniquement). */
  links?: StackLinkDTO[]
  created_at?: string | null
  updated_at?: string | null
}

/**
 * Miroir EXACT de `StackServiceResponse` (lot 2). Représentation publique d'un
 * service membre : aucune valeur sensible (params `secret` masqués côté API).
 */
export interface StackServiceDTO {
  id: string
  template_id: string
  version: string
  /** Alias unique du service dans la stack (clé compose, DNS interne). */
  alias: string
  /** Valeur brute de l'enum `service_status`. */
  service_status: string
  order_index: number
  /** Valeurs des paramètres de provisioning (secrets déjà masqués côté API). */
  params: Record<string, unknown>
  /** Port publié sur l'hôte (alloué au run, lot 3), ou `null`. */
  published_port: number | null
  /** Référence du conteneur (run, lot 3), ou `null`. */
  container_ref: string | null
}

/**
 * Miroir EXACT de `StackLinkResponse` (lot 2). ⚠️ La réponse de détail exprime
 * les liens par **ids** de service (`from_service_id` / `to_service_id`), alors
 * que la requête de création les exprime par alias (`from_alias` / `to_alias`).
 */
export interface StackLinkDTO {
  id: string
  /** Service consommateur (reçoit les variables). */
  from_service_id: string
  /** Service fournisseur (source des variables). */
  to_service_id: string
  /** Mapping `{ ENV_VAR : expression }` (résolu worker-side, sans secret). */
  var_mappings: Record<string, string>
}
