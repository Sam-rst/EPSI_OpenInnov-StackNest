/**
 * Corps réellement accepté par `POST /stacks` (miroir de `StackCreateRequest`,
 * lot 2). ⚠️ Les liens sont exprimés par **alias** (`from_alias` / `to_alias`),
 * pas par ids : le use case résout les alias en ids une fois les services
 * persistés. Aucun secret n'est saisi ici (générés worker-side au lot 3).
 */
export interface StackWriteDTO {
  name: string
  services: StackServiceWriteDTO[]
  links: StackLinkWriteDTO[]
}

/** Un service à composer (entrée du tableau `services[]`). */
export interface StackServiceWriteDTO {
  template_id: string
  version: string
  /** Alias unique du service dans la stack (clé compose). */
  alias: string
  /** Valeurs des paramètres de provisioning. */
  params: Record<string, string>
  /** Ordre d'affichage / d'ajout dans la stack. */
  order: number
}

/** Un lien dirigé entre deux services (entrée du tableau `links[]`). */
export interface StackLinkWriteDTO {
  /** Alias du service consommateur (qui reçoit les variables). */
  from_alias: string
  /** Alias du service fournisseur (dont on dérive les variables). */
  to_alias: string
  /** Mapping variable → expression (résolu côté worker). */
  var_mappings: Record<string, string>
}
