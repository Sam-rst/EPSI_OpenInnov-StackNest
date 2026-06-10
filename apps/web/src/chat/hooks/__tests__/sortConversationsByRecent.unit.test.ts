import { describe, expect, it } from 'vitest'

import type { Conversation } from '../../types/models/Conversation'
import { sortConversationsByRecent } from '../sortConversationsByRecent'

function conv(overrides: Partial<Conversation>): Conversation {
  return {
    id: 'c',
    title: 'Fil',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: null,
    relativeWhen: 'il y a 1 j',
    ...overrides,
  }
}

describe('sortConversationsByRecent', () => {
  it('classe du plus récent au plus ancien (updatedAt sinon createdAt)', () => {
    const ancien = conv({ id: 'ancien', createdAt: '2026-06-01T10:00:00Z', updatedAt: null })
    const recent = conv({ id: 'recent', createdAt: '2026-06-09T10:00:00Z', updatedAt: null })
    const maj = conv({
      id: 'maj',
      createdAt: '2026-06-02T10:00:00Z',
      updatedAt: '2026-06-10T10:00:00Z',
    })

    const sorted = sortConversationsByRecent([ancien, recent, maj])

    expect(sorted.map((c) => c.id)).toEqual(['maj', 'recent', 'ancien'])
  })

  it('ne mute pas le tableau source', () => {
    const list = [conv({ id: 'a' }), conv({ id: 'b' })]
    const snapshot = list.map((c) => c.id)

    sortConversationsByRecent(list)

    expect(list.map((c) => c.id)).toEqual(snapshot)
  })
})
