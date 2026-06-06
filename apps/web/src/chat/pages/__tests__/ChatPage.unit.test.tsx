import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ChatPage } from '../ChatPage'

describe('ChatPage (display-only, état vide honnête)', () => {
  it('rend un titre de page et une mise en page trois colonnes (sidebar · messages · aperçu)', () => {
    const { container } = render(<ChatPage />)

    expect(screen.getByRole('heading', { name: /chat/i })).toBeInTheDocument()
    expect(container.querySelector('.grid')).not.toBeNull()
    expect(screen.getAllByRole('complementary')).toHaveLength(2)
  })

  it('affiche l’état vide honnête de la conversation', async () => {
    render(<ChatPage />)

    expect(await screen.findByText('Démarre une conversation')).toBeInTheDocument()
  })

  it('n’affiche aucune fausse conversation ni fausse identité', async () => {
    render(<ChatPage />)

    await screen.findByText('Démarre une conversation')

    expect(screen.getByText('Aucune conversation')).toBeInTheDocument()
    expect(screen.queryByText(/yassine zouitni/i)).toBeNull()
    expect(screen.queryByText(/john doe/i)).toBeNull()
  })

  it('rend le composer sans déclencher d’envoi réel', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/décris ton besoin/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeDisabled()
  })
})
