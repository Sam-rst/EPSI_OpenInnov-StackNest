import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { clearAccessToken } from '../../../core/api/tokenStore'
import { AuthProvider } from '../../providers/AuthProvider'
import type { AuthContextValue } from '../../contexts/AuthContext'
import { LoginForm } from '../LoginForm'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

afterEach(() => {
  clearAccessToken()
})

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    isAuthenticated: false,
    isInitializing: false,
    user: null,
    setSession: vi.fn(),
    clearSession: vi.fn(),
    ...overrides,
  }
}

function renderForm(auth: AuthContextValue) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  function Tree({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={auth}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={children} />
              <Route path="/dashboard" element={<div>Tableau de bord</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )
  }
  return render(<LoginForm />, { wrapper: Tree })
}

describe('LoginForm', () => {
  it('affiche des erreurs de validation et n’appelle pas l’API si le formulaire est invalide', async () => {
    const setSession = vi.fn()
    renderForm(authValue({ setSession }))

    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(await screen.findByText('Adresse e-mail invalide')).toBeInTheDocument()
    expect(setSession).not.toHaveBeenCalled()
  })

  it('connecte puis redirige vers le tableau de bord', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          access_token: 'tok',
          user: { id: 'u', email: 'a@b.dev', role: 'user', is_verified: true },
        }),
      ),
    )
    const setSession = vi.fn()
    renderForm(authValue({ setSession }))

    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'a@b.dev')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret1')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => expect(screen.getByText('Tableau de bord')).toBeInTheDocument())
    expect(setSession).toHaveBeenCalledTimes(1)
  })

  it('affiche un message d’erreur sur identifiants invalides (401)', async () => {
    server.use(http.post(`${API}/auth/login`, () => new HttpResponse(null, { status: 401 })))
    renderForm(authValue())

    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'a@b.dev')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'mauvais')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(await screen.findByText(/identifiants invalides/i)).toBeInTheDocument()
  })
})
