import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../router'
import { ThemeProvider } from '../theme/ThemeProvider'
import { AuthProvider } from '../../auth/providers/AuthProvider'
import { server } from '../../../tests/mocks/server'

// Le catalogue charge ses données via React Query (GET /catalog/templates[/:id]).
// On stubbe les contrats pour que les routes /catalog rendent sans erreur réseau.
beforeEach(() => {
  server.use(
    http.get('*/catalog/templates', () => HttpResponse.json([])),
    http.get('*/catalog/templates/:id', () =>
      HttpResponse.json({
        id: 'tpl-1',
        slug: 'tpl-1',
        name: 'Template de test',
        icon: 'box',
        category: 'database',
        provider: 'Docker',
        tags: [],
        description: 'Fiche de test du routeur.',
        popular: false,
        versions: [],
        params: [],
      }),
    ),
  )
})

function renderAt(path: string, isAuthenticated = false) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider value={{ isAuthenticated }}>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
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
    ['/dashboard', /tableau de bord/i],
    ['/catalog', /catalogue/i],
    ['/deployments', /déploiements/i],
    ['/deployments/config', /configurer/i],
    ['/chat', /chat/i],
    ['/team', /équipe/i],
    ['/settings', /paramètres/i],
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
  const protectedPaths = [
    '/dashboard',
    '/catalog',
    '/catalog/tpl-1',
    '/deployments',
    '/deployments/dep-1',
    '/deployments/config',
    '/chat',
    '/team',
    '/settings',
  ]

  it.each(protectedPaths)('redirige %s vers /login quand non authentifié', (path) => {
    renderAt(path, false)
    expectLoginRendered()
  })
})

describe('Router — routes placeholder publiques (socle gelé)', () => {
  const publicPlaceholders: [string, RegExp][] = [
    ['/register', /inscription/i],
    ['/forgot', /mot de passe oublié/i],
    ['/reset', /réinitialiser le mot de passe/i],
    ['/verify', /vérification de l['’]e-?mail/i],
  ]

  it.each(publicPlaceholders)(
    'rend la page placeholder %s sans authentification',
    (path, expectedHeading) => {
      renderAt(path, false)
      expect(screen.getByRole('heading', { name: expectedHeading })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /connexion/i })).not.toBeInTheDocument()
    },
  )
})

describe('Router — routes placeholder protégées avec paramètre (socle gelé)', () => {
  const protectedDetailPlaceholders: [string, RegExp][] = [
    ['/deployments/dep-1', /détail du déploiement/i],
  ]

  it.each(protectedDetailPlaceholders)(
    'rend la page placeholder %s quand authentifié',
    (path, expectedHeading) => {
      renderAt(path, true)
      expectPageHeadingInMain(expectedHeading)
    },
  )
})

describe('Router — fiche détail catalogue (/catalog/:id, branchée API)', () => {
  it('monte la fiche détail (lien retour catalogue) quand authentifié', async () => {
    renderAt('/catalog/tpl-1', true)

    const main = screen.getByRole('main')
    expect(
      await within(main).findByRole('link', { name: /retour au catalogue/i }),
    ).toBeInTheDocument()
  })
})

describe('Router — / : landing marketing publique (STN-162)', () => {
  it('rend la landing marketing sur / sans authentification', () => {
    renderAt('/', false)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/sous le capot, du solide/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /connexion/i })).not.toBeInTheDocument()
  })

  it('rend la landing marketing sur / même authentifié (pas de redirection dashboard)', () => {
    renderAt('/', true)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/démarre ton premier déploiement/i)).toBeInTheDocument()
  })

  it('ne monte pas le shell applicatif (Sidebar/TopBar) sur la landing', () => {
    renderAt('/', false)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /principale/i })).not.toBeInTheDocument()
  })
})

describe('Router — CA3 : page 404 sur URL inconnue', () => {
  it('rend la page 404 avec lien retour dashboard', () => {
    renderAt('/chemin-qui-nexiste-pas', true)
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
