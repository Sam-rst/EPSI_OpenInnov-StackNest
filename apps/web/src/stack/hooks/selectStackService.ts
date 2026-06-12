import type { StackDetailModel, StackLinkModel, StackServiceModel } from '../types/models/Stack'

/** Vue d'un service membre enrichie de ses liens entrants et sortants. */
export interface StackServiceView {
  service: StackServiceModel
  /** Liens dont ce service est le consommateur (variables reçues d'un fournisseur). */
  outgoing: readonly StackLinkModel[]
  /** Liens dont ce service est le fournisseur (variables fournies à un consommateur). */
  incoming: readonly StackLinkModel[]
}

/**
 * Dérive la vue détail d'un service depuis le détail d'une stack déjà chargé
 * (`GET /stacks/{id}`) : aucune requête supplémentaire, le détail stack porte
 * déjà services + liens. Sépare le câblage en sortant (ce service consomme) et
 * entrant (ce service fournit). Renvoie `undefined` si la stack ou l'alias est
 * absent.
 */
export function selectStackService(
  stack: StackDetailModel | undefined,
  alias: string | undefined,
): StackServiceView | undefined {
  if (!stack || !alias) {
    return undefined
  }

  const service = stack.services.find((candidate) => candidate.alias === alias)
  if (!service) {
    return undefined
  }

  return {
    service,
    outgoing: stack.links.filter((link) => link.fromAlias === alias),
    incoming: stack.links.filter((link) => link.toAlias === alias),
  }
}
