import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { authApi } from '../auth.api'
import { setAccessToken, clearAccessToken } from '../../../core/api/tokenStore'

// L'origine effective des requêtes : baseURL du client si défini (prod / docker),
// sinon l'origine jsdom contre laquelle axios résout les chemins relatifs en test.
const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

afterEach(() => {
  clearAccessToken()
})

describe('authApi — contrats backend', () => {
  it('login renvoie une session mappée (access token + user enrichi)', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          access_token: 'access.jwt',
          user: { id: 'usr_1', email: 'a@b.dev', role: 'admin', is_verified: true },
        }),
      ),
    )

    const session = await authApi.login({ email: 'a@b.dev', password: 'secret1' })

    expect(session.accessToken).toBe('access.jwt')
    expect(session.user.isAdmin).toBe(true)
  })

  it('register poste email + password et résout sans erreur (202)', async () => {
    let receivedBody: unknown
    server.use(
      http.post(`${API}/auth/register`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 202 })
      }),
    )

    await expect(
      authApi.register({ email: 'new@b.dev', password: 'motdepasse1' }),
    ).resolves.toBeUndefined()
    expect(receivedBody).toEqual({ email: 'new@b.dev', password: 'motdepasse1' })
  })

  it('verify poste le token et résout (204)', async () => {
    let receivedBody: unknown
    server.use(
      http.post(`${API}/auth/verify`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(authApi.verify('verif-token')).resolves.toBeUndefined()
    expect(receivedBody).toEqual({ token: 'verif-token' })
  })

  it('refresh renvoie un nouvel access token', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({ access_token: 'fresh.jwt' })),
    )

    const token = await authApi.refresh()

    expect(token).toBe('fresh.jwt')
  })

  it('me attache le Bearer courant et renvoie un user mappé', async () => {
    setAccessToken('mon.access.token')
    let authHeader: string | null = null
    server.use(
      http.get(`${API}/auth/me`, ({ request }) => {
        authHeader = request.headers.get('authorization')
        return HttpResponse.json({
          id: 'usr_9',
          email: 'me@b.dev',
          role: 'user',
          is_verified: true,
        })
      }),
    )

    const user = await authApi.me()

    expect(authHeader).toBe('Bearer mon.access.token')
    expect(user.email).toBe('me@b.dev')
    expect(user.isAdmin).toBe(false)
  })

  it('logout résout (204)', async () => {
    server.use(http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })))

    await expect(authApi.logout()).resolves.toBeUndefined()
  })

  it('forgot poste l’email et résout (202)', async () => {
    let receivedBody: unknown
    server.use(
      http.post(`${API}/auth/forgot`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 202 })
      }),
    )

    await expect(authApi.forgot({ email: 'a@b.dev' })).resolves.toBeUndefined()
    expect(receivedBody).toEqual({ email: 'a@b.dev' })
  })

  it('reset poste token + password et résout (204)', async () => {
    let receivedBody: unknown
    server.use(
      http.post(`${API}/auth/reset`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(
      authApi.reset({ token: 'reset-token', password: 'nouveau123' }),
    ).resolves.toBeUndefined()
    expect(receivedBody).toEqual({ token: 'reset-token', password: 'nouveau123' })
  })
})
