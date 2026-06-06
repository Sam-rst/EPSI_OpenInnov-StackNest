import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Conversation } from '../../../domain/models/Conversation'
import { ConversationsSidebar } from '../ConversationsSidebar'

describe('ConversationsSidebar', () => {
  it('affiche un état vide honnête quand aucune conversation', () => {
    render(<ConversationsSidebar conversations={[]} activeId={null} onSelect={vi.fn()} />)

    expect(screen.getByText('Aucune conversation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nouvelle conversation/i })).toBeInTheDocument()
  })

  it('liste les conversations fournies et propage la sélection', async () => {
    const conversations: readonly Conversation[] = [
      { id: 'c1', title: 'Env de dev', updatedLabel: "à l'instant" },
    ]
    const onSelect = vi.fn()

    render(
      <ConversationsSidebar conversations={conversations} activeId={null} onSelect={onSelect} />,
    )

    expect(screen.queryByText('Aucune conversation')).toBeNull()
    await userEvent.click(screen.getByText('Env de dev'))

    expect(onSelect).toHaveBeenCalledWith('c1')
  })
})
