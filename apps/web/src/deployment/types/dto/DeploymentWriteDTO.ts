/**
 * Charge utile de création d'un déploiement (`POST /deployments`, back §7).
 *
 * Miroir du contrat figé : `{template_id, version, params, env, limits}`.
 * Le mot de passe n'est jamais envoyé par le client : il est généré côté worker.
 */
export interface DeploymentWriteDTO {
  template_id: string
  /** Libellé de version choisi (ex. « 16 »). */
  version: string
  /** Nom de la ressource saisi par l'utilisateur. */
  name: string
  /** Environnement logique (`dev` | `staging` | `prod`). */
  env: string
  /** Paramètres de provisioning saisis (clé → valeur sérialisée). */
  params: Record<string, string>
  /** Limites de ressources conteneur. */
  limits: DeploymentLimitsDTO
}

/** Limites cpu/mémoire appliquées au conteneur. */
export interface DeploymentLimitsDTO {
  /** Nombre de vCPU plafond (ex. 1). */
  cpu: number
  /** Mémoire plafond en mégaoctets (ex. 512). */
  memory_mb: number
}
