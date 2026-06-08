import type { ConversationDTO } from '../types/dto/ConversationDTO'

/**
 * Fils de discussion d'exemple (display-only) — étiquetés « exemple » dans les
 * titres pour rester honnête tant que le back n'est pas branché. Horodatages
 * relatifs à un « maintenant » glissant calculé au chargement, afin que les
 * libellés (« il y a 2 h ») restent crédibles sans dater la démo.
 */

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

export function buildConversationFixtures(): ConversationDTO[] {
  return [
    {
      id: 'c1',
      title: 'Exemple — Env de dev Node + Postgres',
      created_at: isoAgo(2 * HOUR_MS),
      updated_at: isoAgo(30 * MINUTE_MS),
    },
    {
      id: 'c2',
      title: 'Exemple — Cluster Redis avec replica',
      created_at: isoAgo(5 * HOUR_MS),
      updated_at: isoAgo(2 * HOUR_MS),
    },
    {
      id: 'c3',
      title: 'Exemple — Stack monitoring (ELK + Grafana)',
      created_at: isoAgo(2 * DAY_MS),
      updated_at: isoAgo(DAY_MS),
    },
  ]
}
