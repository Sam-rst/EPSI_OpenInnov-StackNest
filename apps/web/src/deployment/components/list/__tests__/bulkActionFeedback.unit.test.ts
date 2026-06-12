import { describe, expect, it } from 'vitest'

import { BulkAction } from '../../../types/enums/BulkAction'
import { bulkOutcomeMessage } from '../bulkActionFeedback'

describe('bulkOutcomeMessage', () => {
  it('tout en succès (stop) : message de réussite sans échec', () => {
    const message = bulkOutcomeMessage({
      action: BulkAction.STOP,
      succeeded: ['a', 'b'],
      failed: [],
    })

    expect(message.tone).toBe('success')
    expect(message.text).toContain('2')
    expect(message.text).toMatch(/arrêt/i)
  })

  it('singulier accordé', () => {
    const message = bulkOutcomeMessage({
      action: BulkAction.DELETE,
      succeeded: ['a'],
      failed: [],
    })

    expect(message.text).toMatch(/1 déploiement/)
    expect(message.text).toMatch(/supprim/i)
  })

  it('succès partiel : ton avertissement + détail des échecs', () => {
    const message = bulkOutcomeMessage({
      action: BulkAction.START,
      succeeded: ['a'],
      failed: ['b', 'c'],
    })

    expect(message.tone).toBe('warning')
    expect(message.text).toMatch(/2 .*échou/i)
  })

  it('tout en échec : ton erreur', () => {
    const message = bulkOutcomeMessage({
      action: BulkAction.STOP,
      succeeded: [],
      failed: ['a'],
    })

    expect(message.tone).toBe('error')
    expect(message.text).toMatch(/échou/i)
  })
})
