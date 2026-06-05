import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SidebarCostCard } from '../SidebarCostCard'

describe('SidebarCostCard', () => {
  it('affiche le libellé du coût mensuel', () => {
    render(<SidebarCostCard amount={487} changePercent={8} budgetPercent={64} />)

    expect(screen.getByText('Coût ce mois')).toBeInTheDocument()
  })

  it('affiche le montant et la tendance à la hausse (préfixe +)', () => {
    render(<SidebarCostCard amount={487} changePercent={8} budgetPercent={64} />)

    expect(screen.getByText(/487\s*€/)).toBeInTheDocument()
    expect(screen.getByText(/\+8\s*% vs\. mois dernier/)).toBeInTheDocument()
  })

  it('préfixe les baisses du signe négatif sans +', () => {
    render(<SidebarCostCard amount={420} changePercent={-5} budgetPercent={55} />)

    expect(screen.getByText(/-5\s*% vs\. mois dernier/)).toBeInTheDocument()
  })

  it('expose une barre de progression accessible reflétant le budget consommé', () => {
    render(<SidebarCostCard amount={487} changePercent={8} budgetPercent={64} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '64')
  })
})
