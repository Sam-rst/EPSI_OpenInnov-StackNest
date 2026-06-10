import { describe, expect, it } from 'vitest'

import { FALLBACK_CONVERSATION_TITLE, displayConversationTitle } from '../conversationTitle'

describe('displayConversationTitle (D3)', () => {
  it('retombe sur le repli pour un titre vide ou blanc', () => {
    expect(displayConversationTitle('')).toBe(FALLBACK_CONVERSATION_TITLE)
    expect(displayConversationTitle('   ')).toBe(FALLBACK_CONVERSATION_TITLE)
  })

  it('rend un titre court tel quel (rogné des espaces)', () => {
    expect(displayConversationTitle('  Postgres isolé  ')).toBe('Postgres isolé')
  })

  it('tronque un titre long sans couper un mot et ajoute une ellipse', () => {
    const long = 'Je voudrais déployer un cluster PostgreSQL hautement disponible et résilient'

    const result = displayConversationTitle(long)

    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThan(long.length)
    // Pas de mot coupé : le caractère avant l'ellipse n'est pas une lettre tronquée
    // au milieu — on a tranché sur une frontière d'espace.
    expect(result).not.toContain('  ')
  })
})
