import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChatEmptyState } from '../ChatEmptyState'

function renderEmptyState(overrides: Partial<Parameters<typeof ChatEmptyState>[0]> = {}) {
  const props = { onSuggestion: vi.fn(), ...overrides }
  render(<ChatEmptyState {...props} />)
  return props
}

describe('ChatEmptyState', () => {
  it('accueille l’utilisateur avec un message d’introduction', () => {
    renderEmptyState()

    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('propose au moins 3 suggestions de prompts cliquables', () => {
    renderEmptyState()

    const suggestions = screen.getAllByRole('button')
    expect(suggestions.length).toBeGreaterThanOrEqual(3)
  })

  it('propose les suggestions attendues (Postgres, catalogue, déploiements)', () => {
    renderEmptyState()

    expect(screen.getByRole('button', { name: /Postgres/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /catalogue/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /déploiements actifs/i })).toBeInTheDocument()
  })

  it('émet le contenu de la suggestion cliquée via onSuggestion', async () => {
    const user = userEvent.setup()
    const { onSuggestion } = renderEmptyState()

    await user.click(screen.getByRole('button', { name: /Postgres/i }))

    expect(onSuggestion).toHaveBeenCalledTimes(1)
    expect(onSuggestion).toHaveBeenCalledWith(expect.stringMatching(/Postgres/i))
  })

  it('émet une suggestion distincte par bouton', async () => {
    const user = userEvent.setup()
    const { onSuggestion } = renderEmptyState()

    await user.click(screen.getByRole('button', { name: /catalogue/i }))

    expect(onSuggestion).toHaveBeenCalledTimes(1)
    expect(onSuggestion).toHaveBeenCalledWith(expect.stringMatching(/catalogue/i))
  })
})
