import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TopBarSearch } from '../TopBarSearch'

describe('TopBarSearch', () => {
  it('rend un champ de recherche avec placeholder', () => {
    render(<TopBarSearch />)

    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('affiche le raccourci clavier ⌘K', () => {
    render(<TopBarSearch />)

    expect(screen.getByText('⌘K')).toBeInTheDocument()
  })
})
