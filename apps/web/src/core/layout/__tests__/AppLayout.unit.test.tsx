import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppLayout } from '../AppLayout'

function renderWithRoute(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<p data-testid="route-content">contenu de la route</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  it('rend une TopBar accessible (role banner)', () => {
    renderWithRoute()

    expect(screen.getByRole('banner')).toBeInTheDocument()
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
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Boom />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('ferme le drawer au changement de route', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Link to="/autre">aller ailleurs</Link>} />
            <Route path="/autre" element={<p>autre page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
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

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })

    expect(screen.getByRole('navigation')).toHaveAttribute('data-open', 'false')
  })

  it("n'ecoute pas Escape quand le drawer est ferme", () => {
    renderWithRoute()

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })

    expect(screen.getByRole('navigation')).toHaveAttribute('data-open', 'false')
  })
})
