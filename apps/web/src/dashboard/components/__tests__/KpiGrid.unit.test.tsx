import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { KpiGrid } from '../KpiGrid'

describe('KpiGrid', () => {
  it('rend les quatre indicateurs du dashboard', () => {
    render(<KpiGrid />)

    expect(screen.getByText('Ressources actives')).toBeInTheDocument()
    expect(screen.getByText('Coût ce mois')).toBeInTheDocument()
    expect(screen.getByText('Déploiements / 24h')).toBeInTheDocument()
    expect(screen.getByText('Échecs (7j)')).toBeInTheDocument()
  })

  it('affiche des valeurs honnêtes à zéro (aucune donnée inventée)', () => {
    render(<KpiGrid />)

    // Trois compteurs à « 0 » + un coût à « 0 € ».
    expect(screen.getAllByText('0')).toHaveLength(3)
    expect(screen.getByText('0 €')).toBeInTheDocument()
  })

  it('est responsive (2 colonnes mobile, 4 colonnes desktop)', () => {
    const { container } = render(<KpiGrid />)

    const grid = container.firstElementChild as HTMLElement
    expect(grid.className).toContain('grid')
    expect(grid.className).toContain('grid-cols-2')
    expect(grid.className).toContain('lg:grid-cols-4')
  })
})
