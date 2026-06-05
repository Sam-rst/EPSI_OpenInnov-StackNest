import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CatalogEmpty } from '../CatalogEmpty'

describe('CatalogEmpty', () => {
  it('affiche le message d’absence de résultat', () => {
    render(<CatalogEmpty />)

    expect(screen.getByText('Aucune ressource ne correspond.')).toBeInTheDocument()
    expect(
      screen.getByText("Essaie d'élargir tes filtres ou demande au ChatOps."),
    ).toBeInTheDocument()
  })

  it('rend l’icône search-x', () => {
    const { container } = render(<CatalogEmpty />)

    expect(container.querySelector('svg')).not.toBeNull()
  })
})
