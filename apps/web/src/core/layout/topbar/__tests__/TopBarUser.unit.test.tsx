import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TopBarUser } from '../TopBarUser'

describe('TopBarUser', () => {
  it('affiche le nom de l’utilisateur', () => {
    render(<TopBarUser name="Yassine Zouitni" role="Owner · Admin" />)

    expect(screen.getByText('Yassine Zouitni')).toBeInTheDocument()
  })

  it('affiche le rôle de l’utilisateur', () => {
    render(<TopBarUser name="Yassine Zouitni" role="Owner · Admin" />)

    expect(screen.getByText('Owner · Admin')).toBeInTheDocument()
  })

  it('rend l’avatar avec le nom comme libellé accessible', () => {
    render(<TopBarUser name="Yassine Zouitni" role="Owner · Admin" />)

    expect(screen.getByRole('img', { name: 'Yassine Zouitni' })).toBeInTheDocument()
  })
})
