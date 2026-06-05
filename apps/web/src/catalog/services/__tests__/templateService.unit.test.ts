import { describe, expect, it } from 'vitest'

import { listTemplates } from '../templateService'

describe('templateService.listTemplates', () => {
  it('résout avec une liste non vide', async () => {
    const items = await listTemplates()

    expect(items.length).toBeGreaterThan(0)
  })

  it('expose les ressources du catalogue (PostgreSQL)', async () => {
    const items = await listTemplates()
    const pg = items.find((item) => item.id === 'pg16')

    expect(pg?.name).toBe('PostgreSQL')
  })
})
