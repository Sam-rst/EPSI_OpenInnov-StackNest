import type { Status } from '@core/ui';

export interface Kpis {
  activeResources: number;
  monthlyCost: number;
  deploymentsToday: number;
  failures7d: number;
}

export const KPIS: Kpis = {
  activeResources: 24,
  monthlyCost: 487,
  deploymentsToday: 12,
  failures7d: 2,
};

export const COST_SERIES: ReadonlyArray<number> = [
  320, 348, 362, 380, 401, 395, 410, 422, 418, 430, 444, 451, 462, 458, 470,
  478, 485, 480, 492, 488, 495, 502, 510, 506, 514, 520, 528, 524, 532, 487,
];

export interface ActiveResource {
  id: string;
  name: string;
  type: string;
  env: string;
  status: Status;
  cost: string;
  owner: string;
  created: string;
}

export const ACTIVE_RESOURCES: ReadonlyArray<ActiveResource> = [
  { id: 'r-001', name: 'pg-prod-eu',      type: 'PostgreSQL 16',   env: 'prod',    status: 'running',  cost: '24,80 €', owner: 'yassine', created: 'il y a 12 j' },
  { id: 'r-002', name: 'redis-cache-eu',  type: 'Redis 7',         env: 'prod',    status: 'running',  cost: '8,40 €',  owner: 'yassine', created: 'il y a 12 j' },
  { id: 'r-003', name: 'pg-staging',      type: 'PostgreSQL 16',   env: 'staging', status: 'running',  cost: '12,00 €', owner: 'antony',  created: 'il y a 5 j' },
  { id: 'r-004', name: 'sandbox-yassine', type: 'VM Ubuntu 24.04', env: 'dev',     status: 'running',  cost: '6,20 €',  owner: 'yassine', created: 'il y a 2 j' },
  { id: 'r-005', name: 'minio-shared',    type: 'MinIO',           env: 'shared',  status: 'running',  cost: '4,10 €',  owner: 'remi',    created: 'il y a 30 j' },
  { id: 'r-006', name: 'elk-logs',        type: 'Stack ELK',       env: 'prod',    status: 'degraded', cost: '32,00 €', owner: 'thomas',  created: 'il y a 22 j' },
  { id: 'r-007', name: 'vault-secrets',   type: 'Vault',           env: 'prod',    status: 'running',  cost: '5,50 €',  owner: 'yassine', created: 'il y a 60 j' },
  { id: 'r-008', name: 'ollama-mistral',  type: 'Ollama',          env: 'lab',     status: 'running',  cost: '18,90 €', owner: 'mahe',    created: 'il y a 4 j' },
  { id: 'r-009', name: 'pg-dev-julien',   type: 'PostgreSQL 16',   env: 'dev',     status: 'stopped',  cost: '0,00 €',  owner: 'julien',  created: 'il y a 18 j' },
  { id: 'r-010', name: 'nginx-edge',      type: 'Nginx',           env: 'prod',    status: 'running',  cost: '2,40 €',  owner: 'antony',  created: 'il y a 9 j' },
];

export interface Activity {
  who: string;
  what: string;
  target: string;
  when: string;
}

export const RECENT_ACTIVITIES: ReadonlyArray<Activity> = [
  { who: 'yassine', what: 'a déployé',   target: 'pg-prod-eu',     when: 'il y a 2 min' },
  { who: 'julien',  what: 'a configuré', target: 'redis-cache-eu', when: 'il y a 14 min' },
  { who: 'antony',  what: 'a invité',    target: 'remi.reze@…',    when: 'il y a 1 h' },
  { who: 'thomas',  what: 'a redémarré', target: 'elk-logs',       when: 'il y a 2 h' },
  { who: 'mahe',    what: 'a créé',      target: 'ollama-mistral', when: 'il y a 4 h' },
];
