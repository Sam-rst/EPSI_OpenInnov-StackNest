import { describe, expect, it } from 'vitest'

import { MASKED_VALUE, toDisplayParams } from '../paramDisplay'

describe('toDisplayParams', () => {
  it('filtre les clés internes non destinées à l’utilisateur (#14)', () => {
    const entries = toDisplayParams({
      db_name: 'app',
      container_ref: 'a1b2c3',
      internal_id: 'xyz',
    })
    const keys = entries.map(([key]) => key)

    expect(keys).toContain('db_name')
    expect(keys).not.toContain('container_ref')
  })

  it('masque la valeur des paramètres ressemblant à un secret (#17)', () => {
    const entries = toDisplayParams({
      db_name: 'app',
      db_password: 'super-secret',
      api_token: 'abc123',
    })
    const byKey = Object.fromEntries(entries)

    expect(byKey.db_name).toBe('app')
    expect(byKey.db_password).toBe(MASKED_VALUE)
    expect(byKey.api_token).toBe(MASKED_VALUE)
  })

  it('conserve l’ordre et renvoie une liste vide pour un objet vide', () => {
    expect(toDisplayParams({})).toEqual([])
    expect(toDisplayParams({ a: '1', b: '2' }).map(([k]) => k)).toEqual(['a', 'b'])
  })

  it('ne masque pas une valeur non secrète portant un nom anodin', () => {
    const byKey = Object.fromEntries(toDisplayParams({ region: 'eu-west' }))
    expect(byKey.region).toBe('eu-west')
  })
})
