import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChatComposer } from '../ChatComposer'

describe('ChatComposer', () => {
  it('désactive l’envoi tant que le champ est vide', () => {
    render(<ChatComposer onSend={vi.fn()} />)

    expect(screen.getByRole('button', { name: /envoyer/i })).toBeDisabled()
  })

  it('envoie le message saisi (trim) et vide le champ', async () => {
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} />)

    const textarea = screen.getByPlaceholderText(/décris ton besoin/i)
    await userEvent.type(textarea, '  Postgres + Redis  ')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))

    expect(onSend).toHaveBeenCalledWith('Postgres + Redis')
    expect(textarea).toHaveValue('')
  })

  it('n’envoie rien quand le champ ne contient que des espaces', async () => {
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} />)

    await userEvent.type(screen.getByPlaceholderText(/décris ton besoin/i), '   ')

    expect(screen.getByRole('button', { name: /envoyer/i })).toBeDisabled()
    expect(onSend).not.toHaveBeenCalled()
  })

  it('rappelle que l’assistant peut produire des erreurs (honnêteté)', () => {
    render(<ChatComposer onSend={vi.fn()} />)

    expect(screen.getByText(/peut produire des erreurs/i)).toBeInTheDocument()
  })
})
