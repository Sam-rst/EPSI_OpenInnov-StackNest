import type { DeploymentStatus } from '../enums/DeploymentStatus'

/**
 * Déploiement enrichi pour l'UI : enum de statut typé, libellé français
 * pré-calculé et `accessUrl` fournie par l'API. Consommé par la liste et la page
 * détail — les composants reçoivent ce modèle, jamais le DTO.
 *
 * Reflète strictement la vue publique `DeploymentResponse` : un déploiement ne
 * porte que sa propre identité (nom, template provisionné, version, params,
 * accès). Le catalogue (nom/icône/moteur d'un template) n'est pas joint côté
 * API — on n'affiche donc que ce que le contrat fournit réellement.
 */
export interface Deployment {
  id: string
  /** Identifiant du template du catalogue provisionné. */
  templateId: string
  /**
   * Nom lisible du template (ex. « PostgreSQL »), si l'API le joint. Optionnel :
   * on retombe sur `templateId` (UUID) à l'affichage quand il est absent (#13).
   */
  templateName?: string
  version: string
  name: string
  status: DeploymentStatus
  /** Libellé français du statut (ex. « En ligne »). */
  statusLabel: string
  params: Readonly<Record<string, string>>
  host: string | null
  port: number | null
  /** Accès `host:port` fourni par l'API, ou `null` tant que non provisionné. */
  accessUrl: string | null
  /** Date de création ISO 8601, ou `null`. */
  createdAt: string | null
  /** Date de dernière mise à jour ISO 8601, ou `null`. */
  updatedAt: string | null
}
