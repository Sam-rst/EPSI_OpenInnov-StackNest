import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { ChatErrorKind, ChatStreamError } from '../../../types/models/ChatStreamState'
import { ChatError } from '../ChatError'

function error(kind: ChatErrorKind, message = 'Message back honnête'): ChatStreamError {
  return { kind, message }
}

function renderError(overrides: Partial<Parameters<typeof ChatError>[0]> = {}) {
  const props = {
    error: error('network'),
    onRetry: vi.fn(),
    isReconnecting: false,
    ...overrides,
  }
  render(
    <MemoryRouter>
      <ChatError {...props} />
    </MemoryRouter>,
  )
  return props
}

describe('ChatError', () => {
  it('n’affiche rien sans erreur ni reconnexion', () => {
    const { container } = render(
      <MemoryRouter>
        <ChatError error={null} onRetry={vi.fn()} isReconnecting={false} />
      </MemoryRouter>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('affiche une pastille de reconnexion (pas une erreur dure) quand isReconnecting', () => {
    renderError({ isReconnecting: true, error: null })

    expect(screen.getByRole('status')).toHaveTextContent(/Reconnexion/i)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('priorise la reconnexion sur une erreur présente (transition douce)', () => {
    renderError({ isReconnecting: true, error: error('network') })

    expect(screen.getByRole('status')).toHaveTextContent(/Reconnexion/i)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('réseau : message de connexion interrompue', () => {
    renderError({ error: error('network') })

    expect(screen.getByRole('alert')).toHaveTextContent(/connexion interrompue/i)
  })

  it('timeout : message « l’assistant met du temps »', () => {
    renderError({ error: error('timeout') })

    expect(screen.getByRole('alert')).toHaveTextContent(/met du temps/i)
  })

  it('métier : affiche le message du back tel quel + un lien vers le catalogue', () => {
    renderError({ error: error('business', 'Ce template n’existe pas dans le catalogue.') })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ce template n’existe pas dans le catalogue.',
    )
    expect(screen.getByRole('link', { name: /catalogue/i })).toHaveAttribute('href', '/catalog')
  })

  it('auth : invite à se reconnecter', () => {
    renderError({ error: error('auth') })

    expect(screen.getByRole('alert')).toHaveTextContent(/reconnecte-toi/i)
  })

  it('inconnu : message générique honnête', () => {
    renderError({ error: error('unknown') })

    expect(screen.getByRole('alert')).toHaveTextContent(/erreur/i)
  })

  it('le bouton « Réessayer » appelle onRetry', async () => {
    const user = userEvent.setup()
    const { onRetry } = renderError({ error: error('timeout') })

    await user.click(screen.getByRole('button', { name: /Réessayer/ }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('n’affiche pas de bouton « Réessayer » sur une erreur d’authentification', () => {
    renderError({ error: error('auth') })

    expect(screen.queryByRole('button', { name: /Réessayer/ })).toBeNull()
  })
})
