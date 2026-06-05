import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CatalogHeader } from '../CatalogHeader'

describe('CatalogHeader', () => {
  it('affiche le titre du catalogue', () => {
    render(<CatalogHeader count={12} />)

    expect(screen.getByRole('heading', { name: 'Catalogue de ressources' })).toBeInTheDocument()
  })

  it('accorde le sous-titre au pluriel', () => {
    render(<CatalogHeader count={12} />)

    expect(
      screen.getByText(/12 ressources disponibles · provisionnable en moins d'une minute/),
    ).toBeInTheDocument()
  })

  it('accorde le sous-titre au singulier', () => {
    render(<CatalogHeader count={1} />)

    expect(
      screen.getByText(/1 ressource disponible · provisionnable en moins d'une minute/),
    ).toBeInTheDocument()
  })

  it('affiche les actions Importer et Nouvelle ressource', () => {
    render(<CatalogHeader count={12} />)

    expect(screen.getByRole('button', { name: /Importer un module/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nouvelle ressource/ })).toBeInTheDocument()
  })
})
