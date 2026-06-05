import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HowItWorks } from '../HowItWorks'

describe('HowItWorks', () => {
  it('rend une section ancrable #how avec le titre des 3 étapes', () => {
    const { container } = render(<HowItWorks />)

    expect(container.querySelector('#how')).not.toBeNull()
    expect(screen.getByRole('heading', { name: /de l'idée à l'infra en 3 étapes/i })).toBeInTheDocument()
  })

  it('liste les 3 étapes numérotées avec leur titre', () => {
    render(<HowItWorks />)

    expect(screen.getByText('Choisis dans le catalogue')).toBeInTheDocument()
    expect(screen.getByText('Configure ou parle au chatbot')).toBeInTheDocument()
    expect(screen.getByText('Déploie en 1 clic')).toBeInTheDocument()
  })
})
