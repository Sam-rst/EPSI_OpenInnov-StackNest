import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WorkspaceSwitcher } from '../WorkspaceSwitcher'

describe('WorkspaceSwitcher', () => {
  it('rend un bouton de sélection d’espace de travail', () => {
    render(<WorkspaceSwitcher name="StackNest Lab" plan="Team" initials="SN" />)

    expect(screen.getByRole('button', { name: /espace de travail/i })).toBeInTheDocument()
  })

  it('affiche le nom de l’espace, son plan et ses initiales', () => {
    render(<WorkspaceSwitcher name="Acme Corp" plan="Pro" initials="AC" />)

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText(/plan Pro/i)).toBeInTheDocument()
    expect(screen.getByText('AC')).toBeInTheDocument()
  })
})
