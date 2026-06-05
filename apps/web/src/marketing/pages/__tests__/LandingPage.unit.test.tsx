import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ThemeContext } from '../../../core/theme/ThemeContext'
import type { ThemeContextValue } from '../../../core/theme/ThemeContext'
import { LandingPage } from '../LandingPage'

const themeValue: ThemeContextValue = {
  theme: 'light',
  setTheme: () => undefined,
  toggleTheme: () => undefined,
}

function renderLanding(initialPath = '/') {
  const router = createMemoryRouter(
    [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <div>Page de connexion</div> },
    ],
    { initialEntries: [initialPath] },
  )
  render(
    <ThemeContext.Provider value={themeValue}>
      <RouterProvider router={router} />
    </ThemeContext.Provider>,
  )
  return router
}

// La landing monte ~7 sections riches en composants framer-motion : son rendu
// synchrone peut dépasser le timeout par défaut (5 s) sur un worker chargé en
// exécution parallèle. On laisse une marge confortable, le test reste rapide
// quand la machine n'est pas saturée.
const HEAVY_RENDER_TIMEOUT_MS = 20_000

describe('LandingPage', () => {
  it(
    'compose les sections marketing de la landing',
    () => {
      renderLanding()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByText(/sous le capot, du solide/i)).toBeInTheDocument()
      expect(screen.getByText(/démarre ton premier déploiement/i)).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    },
    HEAVY_RENDER_TIMEOUT_MS,
  )

  it(
    'redirige vers /login au clic sur un CTA',
    async () => {
      const user = userEvent.setup()
      const router = renderLanding()
      await user.click(screen.getByRole('button', { name: /voir une démo/i }))
      expect(router.state.location.pathname).toBe('/login')
    },
    HEAVY_RENDER_TIMEOUT_MS,
  )
})
