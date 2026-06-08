import type { MessageDTO } from '../types/dto/MessageDTO'

/**
 * Messages d'amorce d'exemple par fil (display-only). Le fil actif (`c1`) ouvre
 * sur un message d'accueil de l'assistant ; les autres restent vides tant que le
 * back n'est pas branché. Contenu en français, sans HTML (texte brut uniquement).
 */
const WELCOME_C1: MessageDTO = {
  id: 'm-c1-1',
  role: 'assistant',
  content:
    'Bonjour ! Décris-moi ton besoin en français (type de ressource, taille, ' +
    'environnement, options). Je te proposerai un plan à confirmer avant tout déploiement.',
  created_at: new Date(Date.now() - 30 * 60_000).toISOString(),
  action: null,
}

const SEED_MESSAGES: Readonly<Record<string, readonly MessageDTO[]>> = {
  c1: [WELCOME_C1],
  c2: [],
  c3: [],
}

/** Messages d'amorce d'un fil (liste vide si le fil est inconnu). */
export function seedMessagesFor(conversationId: string): readonly MessageDTO[] {
  return SEED_MESSAGES[conversationId] ?? []
}
