import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../../tests/mocks/server'
import { createApiClient } from '../axios-instance'

describe('createApiClient', () => {
  it('prefixe les requetes avec la baseUrl fournie', async () => {
    server.use(http.get('https://api.exemple.test/ping', () => HttpResponse.json({ ok: true })))
    const client = createApiClient({ baseUrl: 'https://api.exemple.test' })

    const response = await client.get<{ ok: boolean }>('/ping')

    expect(response.data).toEqual({ ok: true })
  })

  it('propage les erreurs HTTP en rejetant la promesse', async () => {
    server.use(
      http.get('https://api.exemple.test/boom', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    )
    const client = createApiClient({ baseUrl: 'https://api.exemple.test' })

    await expect(client.get('/boom')).rejects.toThrow()
  })

  it('desactive withCredentials par defaut', () => {
    const client = createApiClient({ baseUrl: 'https://api.exemple.test' })

    expect(client.defaults.withCredentials).toBe(false)
  })

  it('active withCredentials quand demande', () => {
    const client = createApiClient({ baseUrl: 'https://api.exemple.test', withCredentials: true })

    expect(client.defaults.withCredentials).toBe(true)
  })
})
