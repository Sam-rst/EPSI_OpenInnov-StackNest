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
import { useLogout } from '../useLogout'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

afterEach(() => {
  clearAccessToken()
})

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
  return Wrapper
}

describe('useLogout', () => {
  it('déconnecte : appelle /auth/logout, purge le token et vide le contexte', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({ access_token: 'boot.token' })),
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ id: 'usr_1', email: 'out@b.dev', role: 'user', is_verified: true }),
      ),
      http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => ({ logout: useLogout(), auth: useAuth() }), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(true))

    await act(async () => {
      await result.current.logout.mutateAsync()
    })

    await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(false))
    expect(getAccessToken()).toBeNull()
  })

  it('purge l’état local même si l’appel /auth/logout échoue', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({ access_token: 'boot.token' })),
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ id: 'usr_1', email: 'out@b.dev', role: 'user', is_verified: true }),
      ),
      http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 500 })),
    )

    const { result } = renderHook(() => ({ logout: useLogout(), auth: useAuth() }), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(true))

    await act(async () => {
      await result.current.logout.mutateAsync().catch(() => undefined)
    })

    await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(false))
    expect(getAccessToken()).toBeNull()
  })
})
