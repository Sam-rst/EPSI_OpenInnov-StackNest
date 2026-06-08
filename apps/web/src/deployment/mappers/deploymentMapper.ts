import type { DeploymentDTO } from '../types/dto/DeploymentDTO'
import type { DeploymentEventDTO } from '../types/dto/DeploymentEventDTO'
import { DeploymentStatus, labelForStatus } from '../types/enums/DeploymentStatus'
import { toDeploymentStatus } from '../types/guards/deploymentGuards'
import type { Deployment } from '../types/models/Deployment'
import type {
  DeploymentAccess,
  DeploymentEvent,
  DeploymentLog,
  DeploymentLogLevel,
} from '../types/models/DeploymentEvent'

/** Mappe un déploiement API (`DeploymentDTO`) vers le modèle UI `Deployment`. */
export function mapDeploymentDto(dto: DeploymentDTO): Deployment {
  const status = toDeploymentStatus(dto.status)

  return {
    id: dto.id,
    templateId: dto.template_id,
    version: dto.template_version,
    name: dto.name,
    status,
    statusLabel: labelForStatus(status),
    params: dto.params,
    host: dto.host,
    port: dto.published_port,
    accessUrl: dto.access_url,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

/** Déduit le niveau d'affichage d'un log à partir du statut de l'event. */
function logLevelForStatus(status: DeploymentStatus): DeploymentLogLevel {
  if (status === DeploymentStatus.FAILED) {
    return 'err'
  }
  if (status === DeploymentStatus.RUNNING) {
    return 'ok'
  }
  return 'info'
}

/** Horodatage court (HH:MM:SS) au moment de la réception de l'event. */
function nowTime(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour12: false })
}

/** Construit la ligne de log d'un event, à partir de son `message` éventuel. */
function buildLog(dto: DeploymentEventDTO, status: DeploymentStatus): DeploymentLog | undefined {
  if (dto.message === null) {
    return undefined
  }
  return { time: nowTime(), level: logLevelForStatus(status), message: dto.message }
}

/** Construit l'accès d'un event quand l'API a livré l'`access_url` et le secret. */
function buildAccess(dto: DeploymentEventDTO): DeploymentAccess | undefined {
  if (dto.access_url === null || dto.secret === null) {
    return undefined
  }
  return { url: dto.access_url, password: dto.secret }
}

/** Mappe un event SSE (`DeploymentEventDTO`) vers le modèle UI `DeploymentEvent`. */
export function mapDeploymentEventDto(dto: DeploymentEventDTO): DeploymentEvent {
  const status = toDeploymentStatus(dto.status)
  return {
    status,
    log: buildLog(dto, status),
    access: buildAccess(dto),
  }
}
