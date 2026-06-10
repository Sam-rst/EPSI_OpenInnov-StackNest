import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UserAvatar } from '../UserAvatar'

// L'avatar doit refléter le VRAI utilisateur courant (pas un « Vous » codé en dur).
vi.mock('../../../../auth/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ id: 'u1', name: 'samuel.ressiot@gmail.com', role: 'Membre' }),
}))

describe('UserAvatar', () => {
  it('affiche les initiales du vrai utilisateur courant (email → « SR »)', () => {
    render(<UserAvatar />)

    const avatar = screen.getByRole('img', { name: 'samuel.ressiot@gmail.com' })
    expect(avatar).toHaveTextContent('SR')
  })
})
