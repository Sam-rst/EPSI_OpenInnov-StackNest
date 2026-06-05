import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { AppLayout } from '../AppLayout'

function renderWithRoute(initialPath = '/') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p data-testid="route-content">contenu de la route</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('AppLayout', () => {
  it('rend une TopBar accessible (role banner)', () => {
    renderWithRoute()

    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('habille le shell avec les tokens de surface (suit le thème, aucune couleur en dur)', () => {
    const { container } = renderWithRoute()

    const shell = container.firstChild as HTMLElement
    expect(shell).toHaveClass('bg-surface')
    expect(shell).toHaveClass('text-text-primary')
    expect(shell).not.toHaveClass('bg-white')
    expect(shell).not.toHaveClass('text-night')
  })

  it('habille la sidebar avec les tokens de surface (suit le thème)', () => {
    renderWithRoute()

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('bg-surface-elevated')
    expect(nav).toHaveClass('border-border')
    expect(nav).not.toHaveClass('bg-night/5')
  })

  it('rend une Sidebar accessible (role navigation)', () => {
    renderWithRoute()

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('rend la route enfant via Outlet dans la zone main', () => {
    renderWithRoute()

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(main).toContainElement(screen.getByTestId('route-content'))
  })

  it('affiche un fallback ErrorBoundary quand la route enfant plante', () => {
    const Boom = (): never => {
      throw new Error('route-boom')
    }
    render(
      <ThemeProvider>
        <MemoryRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Boom />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('ferme le drawer au changement de route', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Link to="/autre">aller ailleurs</Link>} />
              <Route path="/autre" element={<p>autre page</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: /basculer la navigation/i }))
    expect(screen.getByRole('navigation')).toHaveAttribute('data-open', 'true')

    await user.click(screen.getByRole('link', { name: /aller ailleurs/i }))

    expect(screen.getByRole('navigation')).toHaveAttribute('data-open', 'false')
  })

  it('ferme le drawer quand on appuie sur Escape', async () => {
    const user = userEvent.setup()
    renderWithRoute()

    await user.click(screen.getByRole('button', { name: /basculer la navigation/i }))
    expect(screen.getByRole('navigation')).toHaveAttribute('data-open', 'true')

    // window en jsdom satisfait l'API Window attendue par fireEvent/vi.spyOn
    // (globalThis cote prod dans AppLayout.tsx, window ici pour le typage test).
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.getByRole('navigation')).toHaveAttribute('data-open', 'false')
  })

  it("n'attache pas de listener keydown quand le drawer est ferme", () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    renderWithRoute()

    const keydownListeners = addSpy.mock.calls.filter(([event]) => event === 'keydown')
    expect(keydownListeners).toHaveLength(0)

    addSpy.mockRestore()
  })
})
