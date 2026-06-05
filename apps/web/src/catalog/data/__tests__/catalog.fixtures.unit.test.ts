import { describe, expect, it } from 'vitest'

import { CATALOG_ITEMS } from '../catalog.fixtures'

describe('CATALOG_ITEMS', () => {
  it('contient 12 ressources', () => {
    expect(CATALOG_ITEMS).toHaveLength(12)
  })

  it('expose des identifiants uniques', () => {
    const ids = CATALOG_ITEMS.map((item) => item.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('a tous les champs requis renseignés', () => {
    for (const item of CATALOG_ITEMS) {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.icon).toBeTruthy()
      expect(item.category).toBeTruthy()
      expect(item.provider).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.tags.length).toBeGreaterThan(0)
    }
  })

  it('marque PostgreSQL comme populaire', () => {
    const pg = CATALOG_ITEMS.find((item) => item.id === 'pg16')

    expect(pg?.popular).toBe(true)
  })
})
