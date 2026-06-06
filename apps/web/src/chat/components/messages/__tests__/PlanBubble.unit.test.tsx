import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ChatPlanMessage } from '../../../domain/models/ChatMessage'
import { PlanBubble } from '../PlanBubble'

const planMessage: ChatPlanMessage = {
  id: 'm1',
  role: 'assistant',
  kind: 'plan',
  items: [
    { icon: 'database', name: 'PostgreSQL 16', spec: 'small · 1 vCPU · 2 GB' },
    { icon: 'server', name: 'Redis 7', spec: 'small · 256 MB' },
  ],
  monthlyCost: 16,
  estimatedTime: '~ 35 s',
}

describe('PlanBubble', () => {
  it('liste les ressources du plan', () => {
    render(<PlanBubble message={planMessage} />)

    expect(screen.getByText('PostgreSQL 16')).toBeInTheDocument()
    expect(screen.getByText('small · 1 vCPU · 2 GB')).toBeInTheDocument()
    expect(screen.getByText('Redis 7')).toBeInTheDocument()
  })

  it('affiche le coût estimé et le temps de provisionnement', () => {
    render(<PlanBubble message={planMessage} />)

    expect(screen.getByText('16 €/mois')).toBeInTheDocument()
    expect(screen.getByText('~ 35 s')).toBeInTheDocument()
  })
})
