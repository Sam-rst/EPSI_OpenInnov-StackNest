import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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
})
