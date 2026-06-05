import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FilterList } from '../FilterList'

const ENTRIES = [
  { value: 'Tous', count: 3 },
  { value: 'Database', count: 1 },
  { value: 'Cache', count: 2 },
]

describe('FilterList', () => {
  it('affiche le label et une entrée par valeur', () => {
    render(<FilterList label="Catégorie" entries={ENTRIES} active="Tous" onSelect={vi.fn()} />)

    expect(screen.getByText('Catégorie')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Database/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cache/ })).toBeInTheDocument()
  })

  it('marque l’entrée active', () => {
    render(<FilterList label="Catégorie" entries={ENTRIES} active="Database" onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Database/ }).className).toContain('text-cyan')
  })

  it('appelle onSelect avec la valeur cliquée', async () => {
    const onSelect = vi.fn()
    render(<FilterList label="Catégorie" entries={ENTRIES} active="Tous" onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: /Cache/ }))

    expect(onSelect).toHaveBeenCalledWith('Cache')
  })

  it('affiche les compteurs uniquement si showCount', () => {
    const { rerender } = render(
      <FilterList label="Catégorie" entries={ENTRIES} active="Tous" onSelect={vi.fn()} />,
    )
    expect(screen.queryByText('3')).not.toBeInTheDocument()

    rerender(
      <FilterList label="Catégorie" entries={ENTRIES} active="Tous" onSelect={vi.fn()} showCount />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
