import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { DashboardPage } from '../DashboardPage'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="pathname">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardPage />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('rend l’en-tête, la grille KPI et les deux sections', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeInTheDocument()
    // « Ressources actives » apparaît à la fois en libellé KPI et en titre de section.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Ressources actives' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Activité récente' })).toBeInTheDocument()
  })

  it('affiche des KPI honnêtes à zéro (0 / 0 €)', () => {
    renderPage()

    expect(screen.getAllByText('0')).toHaveLength(3)
    expect(screen.getByText('0 €')).toBeInTheDocument()
  })

  it('affiche des états vides explicites pour les deux sections', () => {
    renderPage()

    expect(screen.getByText('Aucune ressource déployée')).toBeInTheDocument()
    expect(screen.getByText('Aucune activité récente')).toBeInTheDocument()
  })

  it('expose deux CTA « Parcourir le catalogue » (en-tête + état vide ressources)', () => {
    renderPage()

    const ctas = screen.getAllByRole('button', { name: 'Parcourir le catalogue' })
    expect(ctas.length).toBeGreaterThanOrEqual(2)
  })

  it('navigue vers le catalogue depuis le CTA de l’en-tête', async () => {
    renderPage()

    const [headerCta] = screen.getAllByRole('button', { name: 'Parcourir le catalogue' })
    await userEvent.click(headerCta as HTMLElement)

    expect(screen.getByTestId('pathname')).toHaveTextContent('/catalog')
  })

  it('navigue vers le catalogue depuis le CTA de l’état vide « Ressources »', async () => {
    renderPage()

    const ctas = screen.getAllByRole('button', { name: 'Parcourir le catalogue' })
    await userEvent.click(ctas[1] as HTMLElement)

    expect(screen.getByTestId('pathname')).toHaveTextContent('/catalog')
  })

  it('ne rend AUCUNE identité de personne ni coût inventé (honnêteté des données)', () => {
    const { container } = renderPage()
    const text = container.textContent ?? ''
    const words = new Set(text.toLowerCase().match(/[a-zàâäéèêëîïôöùûüç]+/g) ?? [])

    // Identités fictives de l'ancien shell / mockup (prénoms d'équipe + persona).
    expect(text).not.toMatch(/John Doe/)
    expect(text).not.toMatch(/StackNest Lab/)
    for (const member of ['john', 'yassine', 'antony', 'remi', 'thomas', 'mahe', 'julien']) {
      expect(words.has(member)).toBe(false)
    }

    // Aucun montant monétaire non nul (seul « 0 € » est autorisé).
    const euroAmounts = text.match(/\d[\d\s.,]*\s*€/g) ?? []
    for (const amount of euroAmounts) {
      expect(amount.replace(/\s/g, '')).toBe('0€')
    }
  })
})
