import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThinkingBubble } from '../ThinkingBubble'

describe('ThinkingBubble', () => {
  it('expose un statut accessible annonçant la réflexion', () => {
    render(<ThinkingBubble />)

    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('fournit un libellé textuel de réflexion pour les lecteurs d’écran', () => {
    render(<ThinkingBubble />)

    expect(screen.getByText(/réfléchit/i)).toBeInTheDocument()
  })

  it('affiche trois points animés (shimmer de réflexion)', () => {
    const { container } = render(<ThinkingBubble />)

    const dots = container.querySelectorAll('[data-testid="thinking-dot"]')
    expect(dots).toHaveLength(3)
    dots.forEach((dot) => {
      expect(dot.className).toMatch(/animate-bounce/)
    })
  })

  it('affiche l’avatar de l’assistant pour ancrer la bulle', () => {
    const { container } = render(<ThinkingBubble />)

    // L’avatar assistant est décoratif (aria-hidden) : on vérifie sa présence DOM.
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
