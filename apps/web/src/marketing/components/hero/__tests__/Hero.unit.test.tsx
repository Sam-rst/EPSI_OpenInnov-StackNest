import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Hero } from '../Hero'

describe('Hero', () => {
  it('affiche le titre principal et le sous-titre de la plateforme', () => {
    render(<Hero onCta={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/build fast/i)
    expect(screen.getByText(/Internal Developer Platform/i)).toBeInTheDocument()
  })

  it('affiche la trustline honnête sans fausse preuve sociale (CA5)', () => {
    render(<Hero onCta={vi.fn()} />)

    expect(screen.getByText('Aucune carte de crédit')).toBeInTheDocument()
    expect(screen.getByText('Self-host & cloud')).toBeInTheDocument()
    expect(screen.getByText('Open infrastructure')).toBeInTheDocument()
  })

  it('expose une nav avec des ancres internes vers les sections', () => {
    render(<Hero onCta={vi.fn()} />)
    const nav = screen.getByRole('navigation')

    expect(within(nav).getByRole('link', { name: 'Produit' })).toHaveAttribute('href', '#features')
    expect(within(nav).getByRole('link', { name: 'Comment ça marche' })).toHaveAttribute(
      'href',
      '#how',
    )
    expect(within(nav).getByRole('link', { name: 'Stack' })).toHaveAttribute('href', '#stack')
  })

  it('déclenche onCta au clic sur les boutons de connexion / essai', async () => {
    const onCta = vi.fn()
    render(<Hero onCta={onCta} />)

    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))
    await userEvent.click(screen.getAllByRole('button', { name: /essayer stacknest/i })[0])

    expect(onCta).toHaveBeenCalledTimes(2)
  })
})
