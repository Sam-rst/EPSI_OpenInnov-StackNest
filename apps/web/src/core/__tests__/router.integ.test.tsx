import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../router'
import { ThemeProvider } from '../theme/ThemeProvider'
import { AuthProvider } from '../../auth/providers/AuthProvider'
import { server } from '../../../tests/mocks/server'

// EventSource (flux SSE du suivi déploiement) est stubbé globalement dans
// tests/setup.ts : la page de suivi en ouvre un, sans émettre d'event ici.
// Le catalogue et les déploiements chargent leurs données via React Query. On
// stubbe les contrats pour que les routes rendent sans erreur réseau.
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
    http.get('*/deployments/:id', ({ params }) =>
      HttpResponse.json({
        id: params.id,
        template_id: 'pg16',
        template_version: '16',
        name: 'déploiement de test',
        status: 'provisioning',
        params: {},
        host: null,
        published_port: null,
        access_url: null,
        created_at: null,
        updated_at: null,
      }),
    ),
  )
})

function renderAt(path: string, isAuthenticated = false) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  // QueryClientProvider requis : pages d'auth (LoginForm…) et catalogue consomment
  // React Query. retry:false pour que les routes catalogue échouent vite en test.
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

  it('rend ConfigPage sur /deployments/config (invite à choisir un template)', () => {
    renderAt('/deployments/config', true)
    const main = screen.getByRole('main')
    expect(within(main).getByText(/aucun template sélectionné/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /connexion/i })).not.toBeInTheDocument()
  })
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
    ['/register', /créer un compte/i],
    ['/forgot', /mot de passe oublié/i],
    ['/reset', /réinitialiser le mot de passe/i],
    ['/verify', /vérification de l['’]e-?mail/i],
  ]

  it.each(publicPlaceholders)(
    'rend la page réelle %s sans authentification',
    (path, expectedHeading) => {
      renderAt(path, false)
      expect(screen.getByRole('heading', { name: expectedHeading })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /connexion/i })).not.toBeInTheDocument()
    },
  )
})

describe('Router — détail déploiement protégé avec paramètre (/deployments/:id)', () => {
  it('monte la page de suivi (lien retour déploiements) quand authentifié', async () => {
    renderAt('/deployments/dep-1', true)

    const main = screen.getByRole('main')
    expect(
      await within(main).findByRole('link', { name: /retour aux déploiements/i }),
    ).toBeInTheDocument()
  })
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
