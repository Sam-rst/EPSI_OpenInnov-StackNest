import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Personas } from '../Personas'

describe('Personas', () => {
  it('affiche le titre de section et le premier persona par défaut', () => {
    render(<Personas />)

    expect(screen.getByRole('heading', { name: /pensé pour ceux qui codent/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Étudiants' })).toBeInTheDocument()
  })

  it('expose un indicateur cliquable par persona', () => {
    render(<Personas />)

    expect(screen.getByRole('button', { name: /étudiants/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /devs senior/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lead devs pme/i })).toBeInTheDocument()
  })

  it('change de persona actif au clic sur un indicateur', async () => {
    render(<Personas />)

    await userEvent.click(screen.getByRole('button', { name: /lead devs pme/i }))

    expect(screen.getByRole('heading', { level: 3, name: 'Lead devs PME' })).toBeInTheDocument()
  })
})
