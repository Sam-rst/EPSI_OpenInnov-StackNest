import type { DeploymentStatus } from '../enums/DeploymentStatus'
import type { EngineKind } from '../enums/EngineKind'

/**
 * Déploiement enrichi pour l'UI : enums typés, libellés français pré-calculés et
 * `accessUrl` dérivée de `host:port`. Consommé par la liste et la page détail.
 * Les composants reçoivent ce modèle, jamais le DTO.
 */
export interface Deployment {
  id: string
  ownerId: string
  templateId: string
  templateName: string
  templateIcon: string
  engine: EngineKind
  /** Libellé français du moteur (ex. « Docker »). */
  engineLabel: string
  version: string
  /** Image effective `repository:version` (ex. « postgres:16 »), ou `null`. */
  image: string | null
  name: string
  status: DeploymentStatus
  /** Libellé français du statut (ex. « En ligne »). */
  statusLabel: string
  params: Readonly<Record<string, string>>
  host: string | null
  port: number | null
  /** Accès `host:port` formaté, ou `null` tant que non provisionné. */
  accessUrl: string | null
  createdAt: string
  updatedAt: string
}
