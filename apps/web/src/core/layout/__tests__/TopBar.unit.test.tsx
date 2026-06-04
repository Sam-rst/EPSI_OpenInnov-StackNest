import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { TopBar } from '../TopBar'

function renderTopBar() {
  return render(
    <ThemeProvider>
      <TopBar onMenuClick={vi.fn()} menuExpanded={false} />
    </ThemeProvider>,
  )
}

describe('TopBar', () => {
  it('affiche le wordmark StackNest (logo lockup)', () => {
    renderTopBar()

    expect(screen.getByText('StackNest')).toBeInTheDocument()
  })

  it('rend le symbole du logo en variante mono blanche sur fond nuit', () => {
    const { container } = renderTopBar()

    // Le symbole est décoratif (alt="") : pas de rôle a11y, on cible l'élément.
    const mark = container.querySelector('img')
    expect(mark).toHaveAttribute('src', '/assets/logo-mono-white.svg')
  })

  it('expose une bascule de thème accessible', () => {
    renderTopBar()

    expect(screen.getByRole('button', { name: /thème (clair|sombre)/i })).toBeInTheDocument()
  })

  it('conserve le bouton burger de navigation', () => {
    renderTopBar()

    expect(screen.getByRole('button', { name: /basculer la navigation/i })).toBeInTheDocument()
  })
})
