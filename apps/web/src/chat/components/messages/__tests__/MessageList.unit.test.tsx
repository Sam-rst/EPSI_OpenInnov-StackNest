import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ChatMessage } from '../../../domain/models/ChatMessage'
import { MessageList } from '../MessageList'

describe('MessageList', () => {
  it('affiche l’état vide honnête quand aucun message', () => {
    render(<MessageList messages={[]} />)

    expect(screen.getByText('Démarre une conversation')).toBeInTheDocument()
    expect(screen.queryByText(/John Doe/i)).toBeNull()
  })

  it('rend les messages fournis et masque l’état vide', () => {
    const messages: readonly ChatMessage[] = [
      { id: 'u1', role: 'user', kind: 'text', text: 'Bonjour' },
    ]

    render(<MessageList messages={messages} />)

    expect(screen.getByText('Bonjour')).toBeInTheDocument()
    expect(screen.queryByText('Démarre une conversation')).toBeNull()
  })
})
