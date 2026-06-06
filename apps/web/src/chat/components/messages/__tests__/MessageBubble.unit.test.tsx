import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ChatMessage } from '../../../domain/models/ChatMessage'
import { MessageBubble } from '../MessageBubble'

describe('MessageBubble', () => {
  it('rend un message texte utilisateur sans interpréter de HTML', () => {
    const message: ChatMessage = {
      id: 'u1',
      role: 'user',
      kind: 'text',
      text: 'Je veux un <b>environnement</b>',
    }

    const { container } = render(<MessageBubble message={message} />)

    expect(screen.getByText('Je veux un <b>environnement</b>')).toBeInTheDocument()
    expect(container.querySelector('b')).toBeNull()
  })

  it('rend un message plan via PlanBubble', () => {
    const message: ChatMessage = {
      id: 'a1',
      role: 'assistant',
      kind: 'plan',
      items: [{ icon: 'database', name: 'PostgreSQL 16', spec: 'small' }],
      monthlyCost: 12,
      estimatedTime: '~ 20 s',
    }

    render(<MessageBubble message={message} />)

    expect(screen.getByText('PostgreSQL 16')).toBeInTheDocument()
    expect(screen.getByText('12 €/mois')).toBeInTheDocument()
  })
})
