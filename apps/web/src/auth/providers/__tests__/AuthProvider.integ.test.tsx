import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { clearAccessToken, getAccessToken } from '../../../core/api/tokenStore'
import { AuthProvider } from '../AuthProvider'
import { useAuth } from '../../hooks/useAuth'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

afterEach(() => {
  clearAccessToken()
})

function AuthProbe() {
  const { isAuthenticated, isInitializing, user } = useAuth()
  return (
    <div>
      <span data-testid="initializing">{String(isInitializing)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? 'aucun'}</span>
    </div>
  )
}

describe('AuthProvider — reconnexion silencieuse au boot', () => {
  it('au boot : refresh OK puis /me → authentifié avec l’utilisateur chargé', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({ access_token: 'boot.token' })),
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ id: 'usr_1', email: 'boot@b.dev', role: 'admin', is_verified: true }),
      ),
    )

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('initializing')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('email')).toHaveTextContent('boot@b.dev')
    expect(getAccessToken()).toBe('boot.token')
  })

  it('au boot : refresh échoue (pas de cookie) → non authentifié, initialisation terminée', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })))

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('initializing')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('email')).toHaveTextContent('aucun')
  })

  it('accepte une valeur injectée (tests) sans déclencher la reconnexion', () => {
    render(
      <AuthProvider
        value={{
          isAuthenticated: true,
          isInitializing: false,
          user: {
            id: 'x',
            email: 'inject@b.dev',
            role: 'user',
            isVerified: true,
            isAdmin: false,
          },
          setSession: () => undefined,
          clearSession: () => undefined,
        }}
      >
        <AuthProbe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('email')).toHaveTextContent('inject@b.dev')
  })
})
