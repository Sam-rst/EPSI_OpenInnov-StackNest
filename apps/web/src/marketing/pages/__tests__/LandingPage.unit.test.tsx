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

describe('LandingPage', () => {
  it('compose les sections marketing de la landing', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/sous le capot, du solide/i)).toBeInTheDocument()
    expect(screen.getByText(/démarre ton premier déploiement/i)).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('redirige vers /login au clic sur un CTA', async () => {
    const user = userEvent.setup()
    const router = renderLanding()
    await user.click(screen.getByRole('button', { name: /voir une démo/i }))
    expect(router.state.location.pathname).toBe('/login')
  })
})
