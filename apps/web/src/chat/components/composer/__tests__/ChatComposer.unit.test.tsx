import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChatComposer } from '../ChatComposer'

function renderComposer(overrides: Partial<Parameters<typeof ChatComposer>[0]> = {}) {
  const props = { onSend: vi.fn(), disabled: false, ...overrides }
  render(<ChatComposer {...props} />)
  return props
}

describe('ChatComposer', () => {
  it('affiche le disclaimer honnête', () => {
    renderComposer()

    expect(screen.getByText(/StackNest IA peut produire des erreurs/)).toBeInTheDocument()
  })

  it('ne propose pas de bouton pièce-jointe (MVP)', () => {
    renderComposer()

    expect(screen.queryByRole('button', { name: /pièce/i })).toBeNull()
  })

  it('envoie le message saisi et vide le champ', async () => {
    const user = userEvent.setup()
    const { onSend } = renderComposer()

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Je veux un Postgres')
    await user.click(screen.getByRole('button', { name: /Envoyer/ }))

    expect(onSend).toHaveBeenCalledWith('Je veux un Postgres')
    expect(textarea).toHaveValue('')
  })

  it('n’envoie pas un message vide', async () => {
    const user = userEvent.setup()
    const { onSend } = renderComposer()

    await user.type(screen.getByRole('textbox'), '   ')
    await user.click(screen.getByRole('button', { name: /Envoyer/ }))

    expect(onSend).not.toHaveBeenCalled()
  })

  it('envoie via Ctrl+Entrée', async () => {
    const user = userEvent.setup()
    const { onSend } = renderComposer()

    await user.type(screen.getByRole('textbox'), 'Postgres{Control>}{Enter}{/Control}')

    expect(onSend).toHaveBeenCalledWith('Postgres')
  })

  it('désactive l’envoi quand le composer est désactivé', async () => {
    renderComposer({ disabled: true })

    expect(screen.getByRole('button', { name: /Envoyer/ })).toBeDisabled()
  })

  it('affiche un état « envoi… » et verrouille la saisie quand pending — A5', () => {
    renderComposer({ pending: true })

    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByText(/Envoi/i)).toBeInTheDocument()
  })

  it('refocus le champ après un envoi — F2', async () => {
    const user = userEvent.setup()
    renderComposer()

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Un Postgres')
    await user.click(screen.getByRole('button', { name: /Envoyer/ }))

    expect(textarea).toHaveFocus()
  })

  it('vide le champ avec la touche Échap — F2', async () => {
    const user = userEvent.setup()
    const { onSend } = renderComposer()

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'brouillon en cours')
    await user.type(textarea, '{Escape}')

    expect(textarea).toHaveValue('')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('affiche un indicateur discret du modèle (IA locale) — F4', () => {
    renderComposer()

    expect(screen.getByText(/IA locale/i)).toBeInTheDocument()
  })
})
