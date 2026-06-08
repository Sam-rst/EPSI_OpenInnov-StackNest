import type { DeploymentDTO } from '../types/dto/DeploymentDTO'

/**
 * Jeux de données d'EXEMPLE pour le mode display-only (aucune API branchée).
 *
 * ⚠️ Toutes ces ressources sont fictives et explicitement étiquetées « exemple »
 * dans leur nom : aucune donnée réelle, aucun credential réaliste. Le mot de
 * passe n'apparaît jamais ici (il ne transite que par l'event « running »
 * simulé, marqué « exemple » lui aussi). Ces fixtures disparaîtront au
 * branchement API (slice de wiring suivante).
 */
export const EXAMPLE_DEPLOYMENTS: readonly DeploymentDTO[] = [
  {
    id: 'exemple-pg',
    owner_id: 'exemple-user',
    template_id: 'pg16',
    template_name: 'PostgreSQL',
    template_icon: 'database',
    engine: 'docker',
    template_version: '16',
    image_repository: 'postgres',
    name: 'postgresql-exemple',
    status: 'running',
    params: { db_name: 'app', db_user: 'stacknest' },
    host: '10.0.0.5',
    published_port: 32769,
    created_at: '2026-06-07T09:12:00Z',
    updated_at: '2026-06-07T09:13:10Z',
  },
  {
    id: 'exemple-redis',
    owner_id: 'exemple-user',
    template_id: 'redis7',
    template_name: 'Redis',
    template_icon: 'database-zap',
    engine: 'docker',
    template_version: '7',
    image_repository: 'redis',
    name: 'redis-cache-exemple',
    status: 'stopped',
    params: { maxmemory: '256mb' },
    host: '10.0.0.5',
    published_port: 32770,
    created_at: '2026-06-06T15:40:00Z',
    updated_at: '2026-06-07T08:05:00Z',
  },
  {
    id: 'exemple-nginx',
    owner_id: 'exemple-user',
    template_id: 'nginx',
    template_name: 'Nginx',
    template_icon: 'globe',
    engine: 'docker',
    template_version: '1.27',
    image_repository: null,
    name: 'nginx-edge-exemple',
    status: 'provisioning',
    params: {},
    host: null,
    published_port: null,
    created_at: '2026-06-07T09:30:00Z',
    updated_at: '2026-06-07T09:30:05Z',
  },
]

/** Renvoie la fixture d'EXEMPLE correspondant à un identifiant, ou `undefined`. */
export function findExampleDeployment(id: string): DeploymentDTO | undefined {
  return EXAMPLE_DEPLOYMENTS.find((deployment) => deployment.id === id)
}
