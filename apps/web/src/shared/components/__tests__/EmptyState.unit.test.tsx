import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('affiche le titre et la description fournis', () => {
    render(
      <EmptyState
        icon="inbox"
        title="Aucune ressource déployée"
        description="Provisionne ta première ressource depuis le catalogue."
      />,
    )

    expect(screen.getByText('Aucune ressource déployée')).toBeInTheDocument()
    expect(
      screen.getByText('Provisionne ta première ressource depuis le catalogue.'),
    ).toBeInTheDocument()
  })

  it('rend une icône décorative', () => {
    const { container } = render(
      <EmptyState icon="inbox" title="Vide" description="Rien à afficher." />,
    )

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('rend un bouton de CTA qui déclenche le callback au clic', async () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        icon="inbox"
        title="Vide"
        description="Rien à afficher."
        actionLabel="Parcourir le catalogue"
        onAction={onAction}
      />,
    )

    const cta = screen.getByRole('button', { name: 'Parcourir le catalogue' })
    await userEvent.click(cta)

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('n’affiche aucun bouton quand aucun CTA n’est fourni', () => {
    render(<EmptyState icon="inbox" title="Vide" description="Rien à afficher." />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('habille le conteneur avec les tokens sémantiques (suit le thème)', () => {
    const { container } = render(
      <EmptyState icon="inbox" title="Vide" description="Rien à afficher." />,
    )

    const region = container.firstElementChild as HTMLElement
    expect(region.className).toContain('text-text-muted')
    expect(region.className).toContain('border-border')
    expect(region.className).not.toContain('bg-white')
  })
})
