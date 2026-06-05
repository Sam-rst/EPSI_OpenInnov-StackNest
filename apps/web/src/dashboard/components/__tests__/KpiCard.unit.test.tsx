import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { KpiCard } from '../KpiCard'

describe('KpiCard', () => {
  it('affiche le libellé et la valeur fournis', () => {
    render(<KpiCard label="Ressources actives" value="0" icon="layers" />)

    expect(screen.getByText('Ressources actives')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('rend la valeur monétaire telle quelle (ex. « 0 € »)', () => {
    render(<KpiCard label="Coût ce mois" value="0 €" icon="wallet" />)

    expect(screen.getByText('0 €')).toBeInTheDocument()
  })

  it('rend une icône décorative', () => {
    const { container } = render(<KpiCard label="Échecs (7j)" value="0" icon="alert-triangle" />)

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('n’affiche aucune variation/delta inventée', () => {
    render(<KpiCard label="Déploiements / 24h" value="0" icon="rocket" />)

    expect(screen.queryByText(/vs\. période/i)).toBeNull()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('habille la carte avec les tokens sémantiques (suit le thème)', () => {
    const { container } = render(<KpiCard label="Ressources actives" value="0" icon="layers" />)

    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('bg-surface-elevated')
    expect(card.className).toContain('border-border')
    expect(card.className).not.toContain('bg-white')
  })
})
