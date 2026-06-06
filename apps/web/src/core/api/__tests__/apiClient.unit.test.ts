import { describe, expect, it } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient — instance axios partagée', () => {
  it('utilise la baseURL issue de VITE_API_URL', () => {
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
  })

  it('envoie les cookies cross-site (withCredentials) pour le refresh httpOnly', () => {
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it('expose les méthodes HTTP standards', () => {
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })
})
