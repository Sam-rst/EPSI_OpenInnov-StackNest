import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { TopBarUser } from '../TopBarUser'

function renderUser(onLogout: () => void = vi.fn()) {
  render(
    <MemoryRouter>
      <TopBarUser name="Yassine Zouitni" role="Owner · Admin" onLogout={onLogout} />
    </MemoryRouter>,
  )
}

describe('TopBarUser', () => {
  it('affiche le nom de l’utilisateur', () => {
    renderUser()

    expect(screen.getByText('Yassine Zouitni')).toBeInTheDocument()
  })

  it('affiche le rôle de l’utilisateur', () => {
    renderUser()

    expect(screen.getByText('Owner · Admin')).toBeInTheDocument()
  })

  it('rend l’avatar avec le nom comme libellé accessible', () => {
    renderUser()

    expect(screen.getByRole('img', { name: 'Yassine Zouitni' })).toBeInTheDocument()
  })

  it('ouvre le menu et déclenche la déconnexion', () => {
    const onLogout = vi.fn()
    renderUser(onLogout)

    expect(screen.queryByRole('menuitem', { name: /déconnexion/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('menuitem', { name: /déconnexion/i }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('expose les raccourcis Équipe et Paramètres vers les bonnes routes', () => {
    renderUser()

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('menuitem', { name: /équipe/i })).toHaveAttribute('href', '/team')
    expect(screen.getByRole('menuitem', { name: /paramètres/i })).toHaveAttribute(
      'href',
      '/settings',
    )
  })
})
