import type { StackWriteDTO, StackLinkWriteDTO } from '../types/dto/StackWriteDTO'
import type { CompositionLink, CompositionService } from '../types/models/StackComposition'

/**
 * Traduit l'état de composition du builder en corps `POST /stacks` (lot 2).
 *
 * - Les services portent un `order` incrémental (ordre d'affichage / d'ajout).
 * - Les liens sont ré-exprimés par **alias** (`from_alias`/`to_alias`) : le
 *   builder raisonne en `localId` stables (clés React), le contrat back attend
 *   les alias. Un lien dont un service est introuvable est ignoré (défensif).
 * - Le nom et les alias sont nettoyés (`trim`).
 */
export function buildStackPayload(
  name: string,
  services: readonly CompositionService[],
  links: readonly CompositionLink[],
): StackWriteDTO {
  const aliasByLocalId = new Map(services.map((service) => [service.localId, service.alias.trim()]))

  return {
    name: name.trim(),
    services: services.map((service, index) => ({
      template_id: service.template.id,
      version: service.version,
      alias: service.alias.trim(),
      params: service.params,
      order: index,
    })),
    links: links.flatMap((link) => toLinkPayload(link, aliasByLocalId)),
  }
}

/** Construit un lien du payload, ou rien si un de ses services est introuvable. */
function toLinkPayload(
  link: CompositionLink,
  aliasByLocalId: Map<string, string>,
): StackLinkWriteDTO[] {
  const fromAlias = aliasByLocalId.get(link.fromLocalId)
  const toAlias = aliasByLocalId.get(link.toLocalId)
  if (fromAlias === undefined || toAlias === undefined) {
    return []
  }
  return [{ from_alias: fromAlias, to_alias: toAlias, var_mappings: link.varMappings }]
}
