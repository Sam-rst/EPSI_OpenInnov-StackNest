import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { clearAccessToken, getAccessToken } from '../../../core/api/tokenStore'
import { AuthProvider } from '../../providers/AuthProvider'
import { useAuth } from '../useAuth'
import { useLogin } from '../useLogin'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

afterEach(() => {
  clearAccessToken()
})

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
  return Wrapper
}

describe('useLogin', () => {
  it('connecte l’utilisateur : mémorise le token et hydrate le contexte', async () => {
    server.use(
      // Boot : pas de session existante.
      http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          access_token: 'login.token',
          user: { id: 'usr_1', email: 'log@b.dev', role: 'user', is_verified: true },
        }),
      ),
    )

    const { result } = renderHook(() => ({ login: useLogin(), auth: useAuth() }), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.auth.isInitializing).toBe(false))

    await act(async () => {
      await result.current.login.mutateAsync({ email: 'log@b.dev', password: 'secret1' })
    })

    await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(true))
    expect(result.current.auth.user?.email).toBe('log@b.dev')
    expect(getAccessToken()).toBe('login.token')
  })

  it('propage une erreur sur identifiants invalides (401) sans authentifier', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/auth/login`, () => new HttpResponse(null, { status: 401 })),
    )

    const { result } = renderHook(() => ({ login: useLogin(), auth: useAuth() }), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.auth.isInitializing).toBe(false))

    await expect(
      act(async () => {
        await result.current.login.mutateAsync({ email: 'log@b.dev', password: 'mauvais' })
      }),
    ).rejects.toBeDefined()

    expect(result.current.auth.isAuthenticated).toBe(false)
  })
})
