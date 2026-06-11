import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Drawer } from '../Drawer'

function renderDrawer(overrides: Partial<Parameters<typeof Drawer>[0]> = {}) {
  const props = {
    open: true,
    title: 'Conversations',
    onClose: vi.fn(),
    children: <p>Contenu du tiroir</p>,
    ...overrides,
  }
  render(<Drawer {...props} />)
  return props
}

describe('Drawer', () => {
  it('ne rend rien quand il est fermé', () => {
    renderDrawer({ open: false })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('Contenu du tiroir')).toBeNull()
  })

  it('rend le titre et le contenu quand il est ouvert', () => {
    renderDrawer()

    const dialog = screen.getByRole('dialog', { name: 'Conversations' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Contenu du tiroir')).toBeInTheDocument()
  })

  it('ferme via le bouton de fermeture', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDrawer()

    await user.click(screen.getByRole('button', { name: /Fermer/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ferme au clic sur l’arrière-plan', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDrawer()

    await user.click(screen.getByTestId('drawer-backdrop'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ferme sur la touche Échap', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDrawer()

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
