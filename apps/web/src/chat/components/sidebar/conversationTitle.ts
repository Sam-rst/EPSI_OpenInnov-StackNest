/** Titre de repli d'un fil sans titre dérivé exploitable. */
export const FALLBACK_CONVERSATION_TITLE = 'Nouvelle conversation'

/** Longueur maximale d'un titre affiché dans la sidebar avant troncature (D3). */
const MAX_TITLE_LENGTH = 42

/**
 * Dérive le libellé affiché d'un fil dans la sidebar (D3). Le back dérive déjà un
 * titre du 1er message ; côté UI on se contente de le rendre lisible :
 *   - titre vide / blanc → repli « Nouvelle conversation » ;
 *   - titre trop long → tronqué proprement avec une ellipse, sans couper un mot.
 */
export function displayConversationTitle(title: string): string {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    return FALLBACK_CONVERSATION_TITLE
  }
  if (trimmed.length <= MAX_TITLE_LENGTH) {
    return trimmed
  }
  const truncated = trimmed.slice(0, MAX_TITLE_LENGTH)
  const lastSpace = truncated.lastIndexOf(' ')
  const cut = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated
  return `${cut.trimEnd()}…`
}
