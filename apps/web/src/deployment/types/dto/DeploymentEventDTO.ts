/**
 * Miroir EXACT d'une trame SSE du flux `GET /deployments/{id}/events`.
 * Aligné sur le payload back `format_deployment_event_sse`
 * (cf. `app/deployment/presentation/schemas/deployment_event_sse.py`).
 *
 * Chaque event porte le nouveau `status` du déploiement et un `message` humain
 * optionnel (progression / cause d'échec). Le couple `access_url` (`host:port`)
 * + `secret` n'est renseigné QU'UNE seule fois, sur l'event de passage à
 * « running » : c'est le seul canal où le mot de passe transite (jamais en REST),
 * affiché une seule fois côté client.
 */
export interface DeploymentEventDTO {
  /** Nouveau statut du déploiement (valeur brute de `deployment_status`). */
  status: string
  /** Libellé humain de progression / d'échec, ou `null`. */
  message: string | null
  /** Accès `host:port` (uniquement à l'état running), ou `null`. */
  access_url: string | null
  /** Mot de passe généré (uniquement à l'état running, une fois), ou `null`. */
  secret: string | null
}
