import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Conversation } from '../../../types/models/Conversation'
import { ConversationsSidebar } from '../ConversationsSidebar'

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    title: 'Env de dev',
    createdAt: '2026-06-08T10:00:00Z',
    updatedAt: '2026-06-08T11:00:00Z',
    relativeWhen: 'il y a 1 h',
    ...overrides,
  }
}

const conversations: Conversation[] = [
  conversation(),
  conversation({ id: 'c2', title: 'Cluster Redis', relativeWhen: 'il y a 2 h' }),
]

function renderSidebar(overrides: Partial<Parameters<typeof ConversationsSidebar>[0]> = {}) {
  const props = {
    conversations,
    activeId: 'c1',
    loading: false,
    onSelect: vi.fn(),
    onCreate: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<ConversationsSidebar {...props} />)
  return props
}

describe('ConversationsSidebar', () => {
  it('liste les fils et marque l’actif', () => {
    renderSidebar()

    expect(screen.getByText('Env de dev')).toBeInTheDocument()
    expect(screen.getByText('Cluster Redis')).toBeInTheDocument()
    expect(screen.getByText('il y a 1 h')).toBeInTheDocument()
  })

  it('sélectionne un fil au clic', async () => {
    const user = userEvent.setup()
    const { onSelect } = renderSidebar()

    await user.click(screen.getByText('Cluster Redis'))

    expect(onSelect).toHaveBeenCalledWith('c2')
  })

  it('crée une nouvelle conversation', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderSidebar()

    await user.click(screen.getByRole('button', { name: /Nouvelle conversation/ }))

    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('supprime un fil', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderSidebar()

    const deleteButtons = screen.getAllByRole('button', { name: /Supprimer/ })
    await user.click(deleteButtons[0])

    expect(onDelete).toHaveBeenCalledWith('c1')
  })

  it('affiche un état vide honnête sans fil', () => {
    renderSidebar({ conversations: [] })

    expect(screen.getByText(/Aucune conversation/)).toBeInTheDocument()
  })
})
