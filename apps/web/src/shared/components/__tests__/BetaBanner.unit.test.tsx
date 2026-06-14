import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BetaBanner, BETA_BANNER_TEXT } from '../BetaBanner'

describe('BetaBanner', () => {
  it('affiche le rappel bêta avec la formulation unique', () => {
    render(<BetaBanner />)

    expect(screen.getByText(BETA_BANNER_TEXT)).toBeInTheDocument()
    expect(BETA_BANNER_TEXT).toBe('Fonctionnalité en bêta — en cours de développement')
  })

  it('expose un rôle « status » (information non bloquante, annoncée aux lecteurs d’écran)', () => {
    render(<BetaBanner />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('rend une pastille « Bêta » via le Badge de la charte (ton warn lisible)', () => {
    render(<BetaBanner />)

    const badge = screen.getByText('Bêta')
    expect(badge.className).toContain('text-[#7a4604]')
    expect(badge.className).toContain('dark:text-[#ffd07a]')
  })

  it('fusionne une className fournie (placement contextuel)', () => {
    render(<BetaBanner className="mb-6" />)

    expect(screen.getByRole('status')).toHaveClass('mb-6')
  })
})
