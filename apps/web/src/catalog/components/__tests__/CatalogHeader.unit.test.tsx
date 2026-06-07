import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthContext } from '../../../auth/contexts/AuthContext'
import { buildAuthValue } from '../../../../tests/utils/authValue'
import { CatalogHeader } from '../CatalogHeader'

function renderHeader(count: number, isAdmin = false) {
  return render(
    <AuthContext.Provider value={buildAuthValue({ isAdmin })}>
      <MemoryRouter initialEntries={['/catalog']}>
        <Routes>
          <Route path="/catalog" element={<CatalogHeader count={count} />} />
          <Route path="/catalog/admin" element={<div>Écran admin</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('CatalogHeader', () => {
  it('affiche le titre du catalogue', () => {
    renderHeader(12)

    expect(screen.getByRole('heading', { name: 'Catalogue de ressources' })).toBeInTheDocument()
  })

  it('accorde le sous-titre au pluriel', () => {
    renderHeader(12)

    expect(
      screen.getByText(/12 ressources disponibles · provisionnable en moins d'une minute/),
    ).toBeInTheDocument()
  })

  it('accorde le sous-titre au singulier', () => {
    renderHeader(1)

    expect(
      screen.getByText(/1 ressource disponible · provisionnable en moins d'une minute/),
    ).toBeInTheDocument()
  })

  it('affiche les actions admin (Importer, Nouvelle ressource) pour un admin', () => {
    renderHeader(12, true)

    expect(screen.getByRole('button', { name: /Importer un module/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nouvelle ressource/ })).toBeInTheDocument()
  })

  it('masque les actions admin pour un utilisateur non admin', () => {
    renderHeader(12, false)

    expect(screen.queryByRole('button', { name: /Importer un module/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nouvelle ressource/ })).not.toBeInTheDocument()
  })

  it('« Nouvelle ressource » mène à l’écran d’admin du catalogue', async () => {
    renderHeader(12, true)

    await userEvent.click(screen.getByRole('button', { name: /Nouvelle ressource/ }))

    expect(screen.getByText('Écran admin')).toBeInTheDocument()
  })
})
