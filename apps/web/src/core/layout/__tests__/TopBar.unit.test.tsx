import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '../../theme/ThemeProvider'
import { TopBar } from '../TopBar'

function renderTopBar(path = '/catalog') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <TopBar onMenuClick={vi.fn()} menuExpanded={false} />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('TopBar', () => {
  it('rend un en-tête accessible (role banner)', () => {
    renderTopBar()

    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('affiche le titre et le sous-titre de la route courante', () => {
    renderTopBar('/catalog')

    expect(screen.getByText('Catalogue')).toBeInTheDocument()
    expect(screen.getByText('Choisis une ressource à provisionner')).toBeInTheDocument()
  })

  it('résout le titre d’une sous-route (Configurer)', () => {
    renderTopBar('/deployments/config')

    expect(screen.getByText('Configurer')).toBeInTheDocument()
  })

  it('retombe sur StackNest pour une route inconnue', () => {
    renderTopBar('/route-inconnue')

    expect(screen.getByText('StackNest')).toBeInTheDocument()
  })

  it('conserve le bouton burger de navigation', () => {
    renderTopBar()

    expect(screen.getByRole('button', { name: /basculer la navigation/i })).toBeInTheDocument()
  })

  it('expose la recherche, les actions et le bloc utilisateur neutre', () => {
    renderTopBar()

    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /thème (clair|sombre)/i })).toBeInTheDocument()
    // Libellé neutre/anonyme : aucune identité fictive (« John Doe ») rendue.
    expect(screen.getByText('Utilisateur')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).toBeNull()
  })
})
