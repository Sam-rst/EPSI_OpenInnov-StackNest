/**
 * Miroir EXACT d'un déploiement renvoyé par l'API REST (`GET /deployments`,
 * `GET /deployments/{id}`, `POST /deployments`). Aligné sur le schéma back
 * `DeploymentResponse` (cf. `app/deployment/presentation/schemas/deployment_response.py`).
 *
 * Contrat de sécurité figé : `host` + `published_port` ne sont disponibles
 * qu'une fois la ressource provisionnée (sinon `null`) ; `access_url` (`host:port`)
 * de même. Le mot de passe ne transite JAMAIS par ce DTO : il n'apparaît qu'une
 * seule fois dans l'event SSE « running » (cf. `DeploymentEventDTO`).
 */
export interface DeploymentDTO {
  id: string
  template_id: string
  /**
   * Nom lisible du template provisionné (ex. « PostgreSQL »), si l'API le joint.
   * Optionnel : champ récemment ajouté à `DeploymentResponse` — peut être absent
   * d'un back plus ancien, on le mappe donc défensivement (#13).
   */
  template_name?: string | null
  /** Libellé de version déployée (ex. « 16 »). */
  template_version: string
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
  /** Adresse d'accès `host:port` calculée par l'API, ou `null` tant que non publié. */
  access_url: string | null
  /** Date de création ISO 8601, ou `null`. */
  created_at: string | null
  /** Date de dernière mise à jour ISO 8601, ou `null`. */
  updated_at: string | null
}
