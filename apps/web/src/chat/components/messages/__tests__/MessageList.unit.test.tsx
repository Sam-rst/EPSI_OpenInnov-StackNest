import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ActionKind } from '../../../types/enums/ActionKind'
import { ActionStatus } from '../../../types/enums/ActionStatus'
import { MessageRole } from '../../../types/enums/MessageRole'
import type { Message } from '../../../types/models/Message'
import { MessageList } from '../MessageList'

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    role: MessageRole.ASSISTANT,
    content: 'Bonjour, décris ton besoin.',
    createdAt: '2026-06-08T12:00:00Z',
    ...overrides,
  }
}

function renderList(overrides: Partial<Parameters<typeof MessageList>[0]> = {}) {
  const props = {
    messages: [message()],
    streamStatus: 'idle' as const,
    streamingText: '',
    onStop: vi.fn(),
    onConfirmAction: vi.fn(),
    onRejectAction: vi.fn(),
    ...overrides,
  }
  render(
    <MemoryRouter>
      <MessageList {...props} />
    </MemoryRouter>,
  )
  return props
}

describe('MessageList', () => {
  it('rend les messages', () => {
    renderList({
      messages: [
        message({ role: MessageRole.USER, content: 'Je veux un Postgres' }),
        message({ id: 'm2', content: 'Voici ma proposition' }),
      ],
    })

    expect(screen.getByText('Je veux un Postgres')).toBeInTheDocument()
    expect(screen.getByText('Voici ma proposition')).toBeInTheDocument()
  })

  it('n’interprète jamais le contenu comme du HTML', () => {
    renderList({ messages: [message({ content: '<b>danger</b>' })] })

    expect(screen.getByText('<b>danger</b>')).toBeInTheDocument()
    expect(document.querySelector('b')).toBeNull()
  })

  it('affiche la bulle de réflexion dès l’envoi (thinking)', () => {
    renderList({ streamStatus: 'thinking' })

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('affiche la bulle de streaming pendant la génération', () => {
    renderList({ streamStatus: 'streaming', streamingText: 'Post' })

    expect(screen.getByText('Post')).toBeInTheDocument()
  })

  it('propose d’arrêter la génération et appelle onStop', async () => {
    const user = userEvent.setup()
    const { onStop } = renderList({ streamStatus: 'streaming', streamingText: 'Post' })

    await user.click(screen.getByRole('button', { name: /Arrêter la génération/ }))

    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('rend la carte d’action attachée à un message', () => {
    renderList({
      messages: [
        message({
          action: {
            id: 'act-1',
            kind: ActionKind.DEPLOY,
            status: ActionStatus.PROPOSED,
            intent: 'Déployer un Postgres',
            templateId: 'pg16',
            version: '16',
            image: 'postgres:16-alpine',
            params: [],
            quotas: [],
          },
        }),
      ],
    })

    expect(screen.getByRole('button', { name: /Confirmer/ })).toBeInTheDocument()
  })
})
