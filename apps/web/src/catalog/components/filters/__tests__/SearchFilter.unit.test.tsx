import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SearchFilter } from '../SearchFilter'

describe('SearchFilter', () => {
  it('affiche le label « Recherche » et le champ', () => {
    render(<SearchFilter value="" onChange={vi.fn()} />)

    expect(screen.getByText('Recherche')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Postgres, Redis…')).toBeInTheDocument()
  })

  it('reflète la valeur fournie', () => {
    render(<SearchFilter value="redis" onChange={vi.fn()} />)

    expect(screen.getByPlaceholderText('Postgres, Redis…')).toHaveValue('redis')
  })

  it('appelle onChange à la saisie', async () => {
    const onChange = vi.fn()
    render(<SearchFilter value="" onChange={onChange} />)

    await userEvent.type(screen.getByPlaceholderText('Postgres, Redis…'), 'p')

    expect(onChange).toHaveBeenCalledWith('p')
  })
})
