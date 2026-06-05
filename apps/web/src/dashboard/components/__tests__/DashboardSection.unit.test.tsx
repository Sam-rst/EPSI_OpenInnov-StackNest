import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DashboardSection } from '../DashboardSection'

describe('DashboardSection', () => {
  it('rend le titre de la section en heading de niveau 2', () => {
    render(
      <DashboardSection title="Ressources actives">
        <p>contenu</p>
      </DashboardSection>,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Ressources actives' }),
    ).toBeInTheDocument()
  })

  it('rend le contenu enfant', () => {
    render(
      <DashboardSection title="Activité récente">
        <p data-testid="enfant">corps</p>
      </DashboardSection>,
    )

    expect(screen.getByTestId('enfant')).toBeInTheDocument()
  })

  it('habille la carte avec les tokens sémantiques (suit le thème)', () => {
    const { container } = render(
      <DashboardSection title="Ressources actives">
        <p>contenu</p>
      </DashboardSection>,
    )

    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('bg-surface-elevated')
    expect(card.className).toContain('border-border')
    expect(card.className).not.toContain('bg-white')
  })
})
