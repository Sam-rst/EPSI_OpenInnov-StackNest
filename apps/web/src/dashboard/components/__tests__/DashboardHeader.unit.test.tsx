import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DashboardHeader } from '../DashboardHeader'

describe('DashboardHeader', () => {
  it('rend le titre principal en heading', () => {
    render(<DashboardHeader onBrowseCatalog={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument()
  })

  it('affiche un sous-titre neutre (aucun workspace ni période inventés)', () => {
    render(<DashboardHeader onBrowseCatalog={vi.fn()} />)

    expect(
      screen.getByText("Vue d'ensemble de tes ressources et de ton activité"),
    ).toBeInTheDocument()
  })

  it('n’affiche aucune identité ni valeur fictive', () => {
    render(<DashboardHeader onBrowseCatalog={vi.fn()} />)

    expect(screen.queryByText(/John Doe/)).toBeNull()
    expect(screen.queryByText(/StackNest Lab/)).toBeNull()
    expect(screen.queryByText(/€/)).toBeNull()
  })

  it('déclenche la navigation catalogue au clic sur le CTA', async () => {
    const onBrowseCatalog = vi.fn()
    render(<DashboardHeader onBrowseCatalog={onBrowseCatalog} />)

    await userEvent.click(screen.getByRole('button', { name: 'Parcourir le catalogue' }))

    expect(onBrowseCatalog).toHaveBeenCalledTimes(1)
  })
})
