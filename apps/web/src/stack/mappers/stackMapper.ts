import type { StackDTO, StackLinkDTO, StackServiceDTO } from '../types/dto/StackDTO'
import { labelForServiceStatus, toServiceStatus } from '../types/enums/ServiceStatus'
import { labelForStackStatus, toStackStatus } from '../types/enums/StackStatus'
import type {
  StackDetailModel,
  StackLinkModel,
  StackServiceModel,
  StackSummary,
} from '../types/models/Stack'

/** Mappe une réponse résumé (`StackDTO` sans détail) vers le modèle de liste. */
export function mapStackSummary(dto: StackDTO): StackSummary {
  const status = toStackStatus(dto.status)
  return {
    id: dto.id,
    name: dto.name,
    status,
    statusLabel: labelForStackStatus(status),
    serviceCount: dto.services?.length ?? 0,
    createdAt: dto.created_at ?? null,
    updatedAt: dto.updated_at ?? null,
  }
}

/** Mappe un service membre (`StackServiceDTO`) vers le modèle UI. */
function mapService(dto: StackServiceDTO): StackServiceModel {
  const status = toServiceStatus(dto.service_status)
  return {
    id: dto.id,
    templateId: dto.template_id,
    version: dto.version,
    alias: dto.alias,
    status,
    statusLabel: labelForServiceStatus(status),
    orderIndex: dto.order_index,
    params: dto.params,
    publishedPort: dto.published_port,
    containerRef: dto.container_ref,
  }
}

/**
 * Mappe un lien (`StackLinkDTO`, exprimé par ids) vers le modèle UI exprimé par
 * **alias**. La réponse détail porte `from_service_id`/`to_service_id` (ids),
 * alors que l'UI raisonne en alias : on réconcilie via la table id→alias des
 * services. Défensif : id inconnu → on retombe sur l'id brut plutôt que vide.
 */
function mapLink(dto: StackLinkDTO, aliasById: Map<string, string>): StackLinkModel {
  return {
    id: dto.id,
    fromAlias: aliasById.get(dto.from_service_id) ?? dto.from_service_id,
    toAlias: aliasById.get(dto.to_service_id) ?? dto.to_service_id,
    varMappings: dto.var_mappings,
  }
}

/** Mappe une réponse détail (`StackDTO` peuplé) vers le modèle UI complet. */
export function mapStackDetail(dto: StackDTO): StackDetailModel {
  const status = toStackStatus(dto.status)
  const services = (dto.services ?? []).map(mapService)
  const aliasById = new Map(services.map((service) => [service.id, service.alias]))
  const links = (dto.links ?? []).map((link) => mapLink(link, aliasById))

  return {
    id: dto.id,
    name: dto.name,
    status,
    statusLabel: labelForStackStatus(status),
    services,
    links,
    createdAt: dto.created_at ?? null,
    updatedAt: dto.updated_at ?? null,
  }
}
