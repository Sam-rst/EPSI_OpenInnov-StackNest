import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CatalogError } from '../CatalogError'

describe('CatalogError', () => {
  it('affiche un message d’erreur honnête de chargement du catalogue', () => {
    render(<CatalogError />)

    expect(screen.getByText('Catalogue indisponible')).toBeInTheDocument()
    expect(
      screen.getByText(/Impossible de charger le catalogue pour le moment/),
    ).toBeInTheDocument()
  })
})
