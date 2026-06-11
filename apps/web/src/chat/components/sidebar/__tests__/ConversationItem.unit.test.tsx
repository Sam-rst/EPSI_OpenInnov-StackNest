import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Conversation } from '../../../types/models/Conversation'
import { ConversationItem } from '../ConversationItem'

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

function renderItem(overrides: Partial<Parameters<typeof ConversationItem>[0]> = {}) {
  const props = {
    conversation: conversation(),
    active: false,
    onSelect: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(
    <ul>
      <ConversationItem {...props} />
    </ul>,
  )
  return props
}

describe('ConversationItem — renommage inline', () => {
  it('ouvre un champ éditable prérempli au clic sur « Renommer »', async () => {
    const user = userEvent.setup()
    renderItem()

    await user.click(screen.getByRole('button', { name: /Renommer/ }))

    const input = screen.getByRole('textbox', { name: /nom de la conversation/i })
    expect(input).toHaveValue('Env de dev')
  })

  it('valide le nouveau nom sur Entrée et appelle onRename', async () => {
    const user = userEvent.setup()
    const { onRename } = renderItem()

    await user.click(screen.getByRole('button', { name: /Renommer/ }))
    const input = screen.getByRole('textbox', { name: /nom de la conversation/i })
    await user.clear(input)
    await user.type(input, 'Cluster prod{Enter}')

    expect(onRename).toHaveBeenCalledWith('c1', 'Cluster prod')
  })

  it('annule sur Échap sans renommer ni laisser le champ ouvert', async () => {
    const user = userEvent.setup()
    const { onRename } = renderItem()

    await user.click(screen.getByRole('button', { name: /Renommer/ }))
    const input = screen.getByRole('textbox', { name: /nom de la conversation/i })
    await user.type(input, 'peu importe{Escape}')

    expect(onRename).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: /nom de la conversation/i })).toBeNull()
  })

  it('ne renomme pas avec un nom vide', async () => {
    const user = userEvent.setup()
    const { onRename } = renderItem()

    await user.click(screen.getByRole('button', { name: /Renommer/ }))
    const input = screen.getByRole('textbox', { name: /nom de la conversation/i })
    await user.clear(input)
    await user.type(input, '   {Enter}')

    expect(onRename).not.toHaveBeenCalled()
  })
})

describe('ConversationItem — suppression avec confirmation', () => {
  it('n’appelle pas onDelete au premier clic : une confirmation s’affiche', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderItem()

    await user.click(screen.getByRole('button', { name: /Supprimer/ }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('supprime après confirmation', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderItem()

    await user.click(screen.getByRole('button', { name: /Supprimer/ }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /Supprimer/ }))

    expect(onDelete).toHaveBeenCalledWith('c1')
  })

  it('annule la suppression sans appeler onDelete', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderItem()

    await user.click(screen.getByRole('button', { name: /Supprimer/ }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /Annuler/ }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
