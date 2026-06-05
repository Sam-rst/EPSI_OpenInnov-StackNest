import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { CatalogPage } from '../CatalogPage'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="pathname">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/catalog']}>
      <CatalogPage />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogPage', () => {
  it('présente un layout responsive (filtres empilés sous lg, deux colonnes dès lg)', () => {
    renderPage()

    const layout = screen.getByRole('complementary').parentElement
    expect(layout).toHaveClass('grid')
    expect(layout).toHaveClass('lg:grid-cols-[220px_1fr]')
  })

  it('affiche le titre et les ressources après chargement', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Catalogue de ressources' })).toBeInTheDocument()
    expect(await screen.findByText('PostgreSQL')).toBeInTheDocument()
    expect(screen.getByText('Redis')).toBeInTheDocument()
  })

  it('filtre les ressources via la recherche', async () => {
    renderPage()
    await screen.findByText('PostgreSQL')

    await userEvent.type(screen.getByPlaceholderText('Postgres, Redis…'), 'redis')

    await waitFor(() => {
      expect(screen.queryByText('PostgreSQL')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Redis')).toBeInTheDocument()
  })

  it('affiche l’état vide quand aucune ressource ne correspond', async () => {
    renderPage()
    await screen.findByText('PostgreSQL')

    await userEvent.type(screen.getByPlaceholderText('Postgres, Redis…'), 'zzzzz')

    expect(await screen.findByText('Aucune ressource ne correspond.')).toBeInTheDocument()
  })

  it('navigue vers /deployments/config à la sélection d’une ressource', async () => {
    renderPage()
    const card = await screen.findByText('PostgreSQL')

    await userEvent.click(card)

    expect(screen.getByTestId('pathname')).toHaveTextContent('/deployments/config')
  })
})
