import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '../ProtectedRoute'
import { AuthProvider } from '../../providers/AuthProvider'
import type { AuthContextValue } from '../../contexts/AuthContext'
import type { AuthUser } from '../../types/models/AuthUser'

const ADMIN: AuthUser = {
  id: 'usr_admin',
  email: 'admin@b.dev',
  role: 'admin',
  isVerified: true,
  isAdmin: true,
}

const MEMBER: AuthUser = {
  id: 'usr_member',
  email: 'member@b.dev',
  role: 'user',
  isVerified: true,
  isAdmin: false,
}

function makeAuth(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    isAuthenticated: false,
    isInitializing: false,
    user: null,
    setSession: () => undefined,
    clearSession: () => undefined,
    ...overrides,
  }
}

function renderGuarded(auth: AuthContextValue, guarded: React.ReactNode) {
  return render(
    <AuthProvider value={auth}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={guarded} />
          <Route path="/login" element={<div>Page de connexion</div>} />
          <Route path="/dashboard-redirect" element={<div>Refusé</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  it("redirige vers /login quand l'utilisateur n'est pas authentifié", () => {
    renderGuarded(
      makeAuth({ isAuthenticated: false }),
      <ProtectedRoute>
        <div>Contenu protégé</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })

  it("affiche le contenu protégé quand l'utilisateur est authentifié", () => {
    renderGuarded(
      makeAuth({ isAuthenticated: true, user: MEMBER }),
      <ProtectedRoute>
        <div>Contenu protégé</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
    expect(screen.queryByText('Page de connexion')).not.toBeInTheDocument()
  })

  it('affiche un état de chargement pendant la reconnexion silencieuse (pas de redirection prématurée)', () => {
    renderGuarded(
      makeAuth({ isAuthenticated: false, isInitializing: true }),
      <ProtectedRoute>
        <div>Contenu protégé</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Vérification de la session…')).toBeInTheDocument()
    expect(screen.queryByText('Page de connexion')).not.toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })
})

describe('RequireAdmin', () => {
  it('laisse passer un administrateur', async () => {
    const { RequireAdmin } = await import('../RequireAdmin')
    renderGuarded(
      makeAuth({ isAuthenticated: true, user: ADMIN }),
      <RequireAdmin>
        <div>Console admin</div>
      </RequireAdmin>,
    )

    expect(screen.getByText('Console admin')).toBeInTheDocument()
  })

  it('redirige un utilisateur non-admin vers le tableau de bord', async () => {
    const { RequireAdmin } = await import('../RequireAdmin')
    render(
      <AuthProvider value={makeAuth({ isAuthenticated: true, user: MEMBER })}>
        <MemoryRouter initialEntries={['/team']}>
          <Routes>
            <Route
              path="/team"
              element={
                <RequireAdmin>
                  <div>Console admin</div>
                </RequireAdmin>
              }
            />
            <Route path="/dashboard" element={<div>Tableau de bord</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    expect(screen.queryByText('Console admin')).not.toBeInTheDocument()
  })

  it('redirige un visiteur non authentifié vers /login', async () => {
    const { RequireAdmin } = await import('../RequireAdmin')
    render(
      <AuthProvider value={makeAuth({ isAuthenticated: false })}>
        <MemoryRouter initialEntries={['/team']}>
          <Routes>
            <Route
              path="/team"
              element={
                <RequireAdmin>
                  <div>Console admin</div>
                </RequireAdmin>
              }
            />
            <Route path="/login" element={<div>Page de connexion</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
  })
})
