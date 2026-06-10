import type { Conversation } from '../types/models/Conversation'

/** Clé d'activité d'un fil : dernière mise à jour sinon création (ISO, tri lexico = chrono). */
function recencyKey(conversation: Conversation): string {
  return conversation.updatedAt ?? conversation.createdAt ?? ''
}

/**
 * Trie les fils du plus récent au plus ancien (dernière activité d'abord). La
 * sidebar affiche ainsi les récents en tête et le premier élément est le fil
 * ouvert par défaut. Tri non mutatif et stable (`localeCompare` sur ISO 8601).
 */
export function sortConversationsByRecent(
  conversations: readonly Conversation[],
): readonly Conversation[] {
  return [...conversations].sort((a, b) => recencyKey(b).localeCompare(recencyKey(a)))
}
