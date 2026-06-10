import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StreamingBubble } from '../StreamingBubble'

describe('StreamingBubble', () => {
  it('affiche le texte accumulé en cours de streaming', () => {
    render(<StreamingBubble text="Je prépare un PostgreSQL" />)

    expect(screen.getByText(/Je prépare un PostgreSQL/)).toBeInTheDocument()
  })

  it('rend le contenu en Markdown (gras) sans HTML brut', () => {
    const { container } = render(<StreamingBubble text="Voici **gras** en cours" />)

    expect(container.querySelector('strong')).toHaveTextContent('gras')
  })

  it('affiche un caret clignotant en fin de flux', () => {
    const { container } = render(<StreamingBubble text="Post" />)

    const caret = container.querySelector('[data-testid="stream-caret"]')
    expect(caret).toBeInTheDocument()
    expect(caret?.className).toMatch(/animate-pulse/)
  })

  it('expose un statut accessible pour annoncer la génération', () => {
    render(<StreamingBubble text="Post" />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
})
