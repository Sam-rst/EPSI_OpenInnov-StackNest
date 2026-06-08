/**
 * Miroir d'un déploiement renvoyé par l'API (`GET /deployments`,
 * `GET /deployments/{id}`). Reflète l'entité back `Deployment`
 * (cf. `app/deployment/domain/entities/deployment.py`).
 *
 * Contrat figé côté back §5/§7 : `host` + `published_port` ne sont disponibles
 * qu'une fois la ressource provisionnée (sinon `null`). Le mot de passe ne
 * transite JAMAIS par ce DTO : il n'apparaît qu'une fois dans l'event « running ».
 */
export interface DeploymentDTO {
  id: string
  owner_id: string
  template_id: string
  /** Nom affiché du template (joint côté API pour l'affichage liste/détail). */
  template_name: string
  /** Slug d'icône lucide du template (ex. « database »). */
  template_icon: string
  /** Valeur brute de l'enum `engine_kind` (« docker » | « terraform »). */
  engine: string
  /** Libellé de version déployée (ex. « 16 »). */
  template_version: string
  /** Dépôt d'image Docker effectif (ex. « postgres »), ou `null`. */
  image_repository: string | null
  /** Nom de la ressource saisi à la configuration. */
  name: string
  /** Valeur brute de l'enum `deployment_status`. */
  status: string
  /** Paramètres de provisioning saisis (clé → valeur sérialisée). */
  params: Record<string, string>
  /** Hôte d'exécution publié (IP/host), ou `null` tant que non provisionné. */
  host: string | null
  /** Port publié sur l'hôte, ou `null` tant que non provisionné. */
  published_port: number | null
  /** Date de création ISO 8601. */
  created_at: string
  /** Date de dernière mise à jour ISO 8601. */
  updated_at: string
}
