import axios from 'axios'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { attachAuthInterceptor } from '../authInterceptor'
import { clearAccessToken, getAccessToken, setAccessToken } from '../tokenStore'

const API = 'http://api.test'

function makeClient(onAuthFailure = vi.fn()) {
  const client = axios.create({ baseURL: API })
  attachAuthInterceptor(client, { onAuthFailure })
  return { client, onAuthFailure }
}

afterEach(() => {
  clearAccessToken()
  vi.restoreAllMocks()
})

describe('authInterceptor — Bearer + refresh une seule fois', () => {
  it('attache le header Authorization Bearer depuis le tokenStore', async () => {
    setAccessToken('le.token')
    let received: string | null = null
    server.use(
      http.get(`${API}/protected`, ({ request }) => {
        received = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    const { client } = makeClient()

    await client.get('/protected')

    expect(received).toBe('Bearer le.token')
  })

  it('n’attache aucun header quand aucun token n’est présent', async () => {
    let received: string | null = 'présent'
    server.use(
      http.get(`${API}/public`, ({ request }) => {
        received = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    const { client } = makeClient()

    await client.get('/public')

    expect(received).toBeNull()
  })

  it('sur 401 : refresh une fois, mémorise le nouveau token et rejoue la requête', async () => {
    setAccessToken('périmé')
    let protectedCalls = 0
    let refreshCalls = 0
    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json({ access_token: 'nouveau.token' })
      }),
      http.get(`${API}/protected`, ({ request }) => {
        protectedCalls += 1
        if (request.headers.get('authorization') === 'Bearer nouveau.token') {
          return HttpResponse.json({ ok: true })
        }
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const { client, onAuthFailure } = makeClient()

    const response = await client.get('/protected')

    expect(response.data).toEqual({ ok: true })
    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(2)
    expect(getAccessToken()).toBe('nouveau.token')
    expect(onAuthFailure).not.toHaveBeenCalled()
  })

  it('si le refresh échoue : purge le token et déclenche onAuthFailure', async () => {
    setAccessToken('périmé')
    server.use(
      http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
      http.get(`${API}/protected`, () => new HttpResponse(null, { status: 401 })),
    )
    const { client, onAuthFailure } = makeClient()

    await expect(client.get('/protected')).rejects.toBeDefined()
    expect(getAccessToken()).toBeNull()
    expect(onAuthFailure).toHaveBeenCalledTimes(1)
  })

  it('ne tente PAS de refresh si la requête 401 est elle-même /auth/refresh (anti-boucle)', async () => {
    // Session existante : un /auth/refresh dont le cookie est lui aussi expiré → session morte.
    setAccessToken('session.vivante')
    let refreshCalls = 0
    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const { client, onAuthFailure } = makeClient()

    await expect(client.post('/auth/refresh')).rejects.toBeDefined()
    expect(refreshCalls).toBe(1)
    expect(onAuthFailure).toHaveBeenCalledTimes(1)
  })

  it('ne redirige PAS sur une sonde de reconnexion à froid (aucun token préalable)', async () => {
    // Cold boot : pas de session, le refresh échoue → silencieux (pas de redirection /login).
    server.use(http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })))
    const { client, onAuthFailure } = makeClient()

    await expect(client.post('/auth/refresh')).rejects.toBeDefined()
    expect(onAuthFailure).not.toHaveBeenCalled()
  })

  it('ne tente PAS de refresh sur un 401 de login (identifiants invalides)', async () => {
    let refreshCalls = 0
    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json({ access_token: 'x' })
      }),
      http.post(`${API}/auth/login`, () => new HttpResponse(null, { status: 401 })),
    )
    const { client, onAuthFailure } = makeClient()

    await expect(client.post('/auth/login')).rejects.toBeDefined()
    expect(refreshCalls).toBe(0)
    expect(onAuthFailure).not.toHaveBeenCalled()
  })

  it('ne rejoue qu’une seule fois : un second 401 après refresh propage l’erreur', async () => {
    setAccessToken('périmé')
    let refreshCalls = 0
    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json({ access_token: 'encore.périmé' })
      }),
      http.get(`${API}/protected`, () => new HttpResponse(null, { status: 401 })),
    )
    const { client, onAuthFailure } = makeClient()

    await expect(client.get('/protected')).rejects.toBeDefined()
    expect(refreshCalls).toBe(1)
    expect(onAuthFailure).toHaveBeenCalledTimes(1)
  })
})
