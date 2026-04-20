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

describe('Router — CA2 : redirection vers /login pour routes protégées sans auth', () => {
  const protectedPaths = ['/dashboard', '/catalog', '/deployments', '/chat']

  it.each(protectedPaths)('redirige %s vers /login quand non authentifié', (path) => {
    renderAt(path, false)
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
  })

  it.each(protectedPaths)('affiche la page protégée %s quand authentifié', (path) => {
    renderAt(path, true)
    expect(screen.queryByRole('heading', { name: /connexion/i })).not.toBeInTheDocument()
  })
})

describe('Router — CA3 : page 404 sur URL inconnue', () => {
  it('rend la page 404 avec lien retour dashboard', () => {
    renderAt('/chemin-qui-nexiste-pas', true)
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
