import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../router'
import { AuthProvider } from '../../auth/providers/AuthProvider'

function renderAt(path: string, isAuthenticated = false) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <AuthProvider value={{ isAuthenticated }}>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

function expectLoginRendered() {
  expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
}

function expectPageHeadingInMain(expected: RegExp) {
  const main = screen.getByRole('main')
  expect(within(main).getByRole('heading', { name: expected })).toBeInTheDocument()
}

describe('Router — CA1 : routes accessibles selon auth', () => {
  it('rend la page Login sur /login (route publique)', () => {
    renderAt('/login')
    expectLoginRendered()
  })

  const protectedRoutes: [string, RegExp][] = [
    ['/dashboard', /dashboard/i],
    ['/catalog', /catalogue/i],
    ['/deployments', /déploiements/i],
    ['/chat', /chat/i],
  ]

  it.each(protectedRoutes)(
    'rend la page attendue sur %s quand authentifié',
    (path, expectedHeading) => {
      renderAt(path, true)
      expectPageHeadingInMain(expectedHeading)
      expect(screen.queryByRole('heading', { name: /connexion/i })).not.toBeInTheDocument()
    },
  )
})

describe('Router — CA2 : redirection vers /login pour routes protégées', () => {
  const protectedPaths = ['/dashboard', '/catalog', '/deployments', '/chat']

  it.each(protectedPaths)('redirige %s vers /login quand non authentifié', (path) => {
    renderAt(path, false)
    expectLoginRendered()
  })

  it('redirige / vers /login quand non authentifié (via /dashboard)', () => {
    renderAt('/', false)
    expectLoginRendered()
  })

  it('redirige / vers /dashboard quand authentifié', () => {
    renderAt('/', true)
    expectPageHeadingInMain(/dashboard/i)
  })
})

describe('Router — CA3 : page 404 sur URL inconnue', () => {
  it('rend la page 404 avec lien retour dashboard', () => {
    renderAt('/chemin-qui-nexiste-pas', true)
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
