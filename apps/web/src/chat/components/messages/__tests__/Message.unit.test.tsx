import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { MessageRole } from '../../../types/enums/MessageRole'
import type { Message as MessageModel } from '../../../types/models/Message'
import { Message } from '../Message'

function message(overrides: Partial<MessageModel> = {}): MessageModel {
  return {
    id: 'm1',
    role: MessageRole.ASSISTANT,
    content: 'Bonjour',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function renderMessage(overrides: Partial<MessageModel> = {}) {
  render(
    <MemoryRouter>
      <Message message={message(overrides)} onConfirmAction={vi.fn()} onRejectAction={vi.fn()} />
    </MemoryRouter>,
  )
}

describe('Message', () => {
  it('rend le contenu utilisateur en texte simple (pas de Markdown)', () => {
    renderMessage({ role: MessageRole.USER, content: 'Je veux un **Postgres**' })

    // Texte brut : les astérisques restent visibles, aucun <strong>.
    expect(screen.getByText('Je veux un **Postgres**')).toBeInTheDocument()
    expect(document.querySelector('strong')).toBeNull()
  })

  it('rend le contenu assistant en Markdown (gras)', () => {
    renderMessage({ role: MessageRole.ASSISTANT, content: 'Voici **Postgres**' })

    expect(document.querySelector('strong')).toHaveTextContent('Postgres')
  })

  it('n’interprète jamais le HTML brut du contenu assistant', () => {
    renderMessage({ role: MessageRole.ASSISTANT, content: '<b>danger</b>' })

    expect(screen.getByText('<b>danger</b>')).toBeInTheDocument()
    expect(document.querySelector('b')).toBeNull()
  })

  it('affiche un horodatage relatif', () => {
    renderMessage({ createdAt: new Date().toISOString() })

    expect(screen.getByText(/à l’instant/)).toBeInTheDocument()
  })

  it('affiche l’avatar du vrai utilisateur courant pour un message user', () => {
    // Hors AuthProvider, useCurrentUser retombe sur l'utilisateur neutre
    // (« Utilisateur ») — jamais un « Vous » codé en dur.
    renderMessage({ role: MessageRole.USER, content: 'Salut' })

    expect(screen.getByRole('img', { name: /Utilisateur/ })).toBeInTheDocument()
  })

  it('remplace un bloc JSON de déploiement par un CTA (fallback C2)', () => {
    renderMessage({
      role: MessageRole.ASSISTANT,
      content: 'Proposition :\n```json\n{ "template_id": "pg16" }\n```',
    })

    expect(screen.getByRole('button', { name: /Configurer ce déploiement/ })).toBeInTheDocument()
    expect(screen.queryByText(/template_id/)).toBeNull()
  })

  it('rend la carte d’action structurée quand elle est présente', () => {
    renderMessage({
      role: MessageRole.ASSISTANT,
      content: 'Voici ma proposition',
      action: {
        id: 'act-1',
        kind: 'deploy',
        status: 'proposed',
        intent: 'Déployer un Postgres',
        templateId: 'pg16',
        version: '16',
        image: 'postgres:16-alpine',
        params: [],
        quotas: [],
      },
    })

    expect(screen.getByRole('button', { name: /Confirmer/ })).toBeInTheDocument()
  })
})
