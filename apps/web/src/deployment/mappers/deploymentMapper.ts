import type { DeploymentDTO } from '../types/dto/DeploymentDTO'
import type { DeploymentEventDTO } from '../types/dto/DeploymentEventDTO'
import { labelForStatus } from '../types/enums/DeploymentStatus'
import { labelForEngine } from '../types/enums/EngineKind'
import { toDeploymentStatus, toEngineKind } from '../types/guards/deploymentGuards'
import type { Deployment } from '../types/models/Deployment'
import type { DeploymentEvent } from '../types/models/DeploymentEvent'

/** Construit l'image effective `repository:version`, ou `null` si non provisionnée. */
function buildImage(repository: string | null, version: string): string | null {
  if (repository === null) {
    return null
  }
  return `${repository}:${version}`
}

/** Construit l'accès `host:port`, ou `null` tant que l'un des deux manque. */
function buildAccessUrl(host: string | null, port: number | null): string | null {
  if (host === null || port === null) {
    return null
  }
  return `${host}:${port}`
}

/** Mappe un déploiement API (`DeploymentDTO`) vers le modèle UI `Deployment`. */
export function mapDeploymentDto(dto: DeploymentDTO): Deployment {
  const engine = toEngineKind(dto.engine)
  const status = toDeploymentStatus(dto.status)

  return {
    id: dto.id,
    ownerId: dto.owner_id,
    templateId: dto.template_id,
    templateName: dto.template_name,
    templateIcon: dto.template_icon,
    engine,
    engineLabel: labelForEngine(engine),
    version: dto.template_version,
    image: buildImage(dto.image_repository, dto.template_version),
    name: dto.name,
    status,
    statusLabel: labelForStatus(status),
    params: dto.params,
    host: dto.host,
    port: dto.published_port,
    accessUrl: buildAccessUrl(dto.host, dto.published_port),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

/** Mappe un event SSE (`DeploymentEventDTO`) vers le modèle UI `DeploymentEvent`. */
export function mapDeploymentEventDto(dto: DeploymentEventDTO): DeploymentEvent {
  return {
    at: dto.at,
    status: dto.status === undefined ? undefined : toDeploymentStatus(dto.status),
    log: dto.log,
    access: dto.access,
  }
}
