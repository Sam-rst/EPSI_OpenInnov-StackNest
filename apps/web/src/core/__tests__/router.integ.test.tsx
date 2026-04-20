import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../router'
import { AuthProvider } from '../providers/AuthProvider'

function renderAt(path: string, isAuthenticated = false) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <AuthProvider value={{ isAuthenticated }}>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('Router — CA1 : routes publiques accessibles', () => {
  it('rend la page Login sur /login', () => {
    renderAt('/login')
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
  })
})

describe('Router — CA1/CA2 : pages protégées accessibles authentifié, redirigées sinon', () => {
  const protectedRoutes: [string, RegExp][] = [
    ['/dashboard', /dashboard/i],
    ['/catalog', /catalogue/i],
    ['/deployments', /déploiements/i],
    ['/chat', /chat/i],
  ]

  it.each(protectedRoutes)('redirige %s vers /login quand non authentifié', (path) => {
    renderAt(path, false)
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
  })

  it.each(protectedRoutes)(
    'rend la page attendue sur %s quand authentifié',
    (path, expectedHeading) => {
      renderAt(path, true)
      expect(screen.getByRole('heading', { name: expectedHeading })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /connexion/i })).not.toBeInTheDocument()
    },
  )

  it('redirige / vers /login quand non authentifié (via /dashboard)', () => {
    renderAt('/', false)
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
  })

  it('redirige / vers /dashboard quand authentifié', () => {
    renderAt('/', true)
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
})

describe('Router — CA3 : page 404 sur URL inconnue', () => {
  it('rend la page 404 avec lien retour dashboard', () => {
    renderAt('/chemin-qui-nexiste-pas', true)
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
