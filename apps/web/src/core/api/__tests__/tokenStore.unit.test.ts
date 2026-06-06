import { afterEach, describe, expect, it } from 'vitest'
import { clearAccessToken, getAccessToken, setAccessToken } from '../tokenStore'

describe("tokenStore — store mémoire de l'access token", () => {
  afterEach(() => {
    clearAccessToken()
  })

  it("retourne null tant qu'aucun token n'a été défini", () => {
    expect(getAccessToken()).toBeNull()
  })

  it('mémorise le token fourni à setAccessToken', () => {
    setAccessToken('jwt-abc-123')

    expect(getAccessToken()).toBe('jwt-abc-123')
  })

  it('remplace le token précédent au prochain setAccessToken', () => {
    setAccessToken('premier-token')
    setAccessToken('second-token')

    expect(getAccessToken()).toBe('second-token')
  })

  it('efface le token avec clearAccessToken', () => {
    setAccessToken('jwt-a-effacer')

    clearAccessToken()

    expect(getAccessToken()).toBeNull()
  })
})
