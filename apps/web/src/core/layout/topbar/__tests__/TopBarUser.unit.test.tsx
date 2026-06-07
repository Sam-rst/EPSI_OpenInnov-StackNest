import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TopBarUser } from '../TopBarUser'

describe('TopBarUser', () => {
  it('affiche le nom de l’utilisateur', () => {
    render(<TopBarUser name="Yassine Zouitni" role="Owner · Admin" onLogout={vi.fn()} />)

    expect(screen.getByText('Yassine Zouitni')).toBeInTheDocument()
  })

  it('affiche le rôle de l’utilisateur', () => {
    render(<TopBarUser name="Yassine Zouitni" role="Owner · Admin" onLogout={vi.fn()} />)

    expect(screen.getByText('Owner · Admin')).toBeInTheDocument()
  })

  it('rend l’avatar avec le nom comme libellé accessible', () => {
    render(<TopBarUser name="Yassine Zouitni" role="Owner · Admin" onLogout={vi.fn()} />)

    expect(screen.getByRole('img', { name: 'Yassine Zouitni' })).toBeInTheDocument()
  })

  it('ouvre le menu et déclenche la déconnexion', () => {
    const onLogout = vi.fn()
    render(<TopBarUser name="Yassine Zouitni" role="Owner · Admin" onLogout={onLogout} />)

    expect(screen.queryByRole('menuitem', { name: /déconnexion/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('menuitem', { name: /déconnexion/i }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
