import type { ConversationDTO } from '../types/dto/ConversationDTO'

/**
 * Fils de discussion d'exemple (display-only) — étiquetés « exemple » dans les
 * titres pour rester honnête tant que le back n'est pas branché. Horodatages
 * relatifs à un « maintenant » glissant calculé à l'amorce, afin que les
 * libellés (« il y a 2 h ») restent crédibles sans dater la démo.
 *
 * Un petit store en mémoire (réinitialisable pour les tests) fait persister les
 * créations/renommages/suppressions le temps de la session : le seam REST se
 * comporte comme une vraie liste serveur, sans backend.
 */

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

function seedConversations(): ConversationDTO[] {
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

let store: ConversationDTO[] = seedConversations()

/** Réinitialise le store sur les fils d'exemple (utilisé par les tests). */
export function resetConversationStore(): void {
  store = seedConversations()
}

/** Renvoie une copie de la liste courante des fils. */
export function listConversationStore(): ConversationDTO[] {
  return [...store]
}

/** Insère un fil en tête de liste et le renvoie. */
export function addConversationToStore(dto: ConversationDTO): ConversationDTO {
  store = [dto, ...store]
  return dto
}

/** Renomme un fil dans le store et renvoie sa version à jour (ou `undefined`). */
export function renameConversationInStore(id: string, title: string): ConversationDTO | undefined {
  let updated: ConversationDTO | undefined
  store = store.map((conversation) => {
    if (conversation.id !== id) {
      return conversation
    }
    updated = { ...conversation, title, updated_at: new Date().toISOString() }
    return updated
  })
  return updated
}

/** Supprime un fil du store. */
export function removeConversationFromStore(id: string): void {
  store = store.filter((conversation) => conversation.id !== id)
}
