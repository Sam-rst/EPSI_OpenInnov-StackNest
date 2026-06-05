import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComingSoon } from '../ComingSoon'

describe('ComingSoon', () => {
  it('rend le titre comme en-tête de page', () => {
    render(<ComingSoon icon="users" title="Équipe" description="Gère les membres." />)

    expect(screen.getByRole('heading', { name: 'Équipe' })).toBeInTheDocument()
  })

  it('affiche la description fournie', () => {
    render(<ComingSoon icon="users" title="Équipe" description="Gère les membres." />)

    expect(screen.getByText('Gère les membres.')).toBeInTheDocument()
  })

  it('signale que la fonctionnalité arrive bientôt', () => {
    render(<ComingSoon icon="settings" title="Paramètres" description="Profil et sécurité." />)

    expect(screen.getByText(/bientôt disponible/i)).toBeInTheDocument()
  })
})
