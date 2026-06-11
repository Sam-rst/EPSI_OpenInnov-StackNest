import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { TemplateCardDTO } from '../../types/dto/TemplateCardDTO'
import { CatalogPage } from '../CatalogPage'

const cards: TemplateCardDTO[] = [
  {
    id: 'pg16',
    slug: 'postgresql',
    name: 'PostgreSQL',
    icon: 'database',
    category: 'database',
    provider: 'Docker',
    engine: 'docker',
    tags: ['SQL'],
    description: 'Base relationnelle managée.',
    popular: true,
  },
  {
    id: 'redis7',
    slug: 'redis',
    name: 'Redis',
    icon: 'server',
    category: 'cache',
    provider: 'Docker',
    engine: 'docker',
    tags: ['Cache'],
    description: 'Store clé-valeur ultra-rapide.',
    popular: true,
  },
  {
    id: 'k8s',
    slug: 'kubernetes',
    name: 'Cluster Kubernetes',
    icon: 'boxes',
    category: 'vm',
    provider: 'Terraform',
    engine: 'terraform',
    tags: ['K8s'],
    description: 'Cluster Kubernetes managé.',
    popular: false,
  },
]

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="pathname">{location.pathname}</div>
}

function renderPage() {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/catalog']}>
        <CatalogPage />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('CatalogPage (branchée API)', () => {
  it('charge les ressources depuis l’API et les affiche', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json(cards)))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Catalogue de ressources' })).toBeInTheDocument()
    expect(await screen.findByText('PostgreSQL')).toBeInTheDocument()
    expect(screen.getByText('Redis')).toBeInTheDocument()
  })

  it('filtre les ressources via la recherche (client)', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json(cards)))

    renderPage()
    await screen.findByText('PostgreSQL')

    await userEvent.type(screen.getByPlaceholderText('Postgres, Redis…'), 'redis')

    await waitFor(() => {
      expect(screen.queryByText('PostgreSQL')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Redis')).toBeInTheDocument()
  })

  it('affiche l’état vide quand aucune ressource ne correspond', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json(cards)))

    renderPage()
    await screen.findByText('PostgreSQL')

    await userEvent.type(screen.getByPlaceholderText('Postgres, Redis…'), 'zzzzz')

    expect(await screen.findByText('Aucune ressource ne correspond.')).toBeInTheDocument()
  })

  it('navigue vers la fiche détail à la sélection d’une ressource', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json(cards)))

    renderPage()
    const card = await screen.findByText('PostgreSQL')

    await userEvent.click(card)

    expect(screen.getByTestId('pathname')).toHaveTextContent('/catalog/pg16')
  })

  it('affiche la carte Terraform bloquée et ne navigue pas à son clic', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json(cards)))

    renderPage()
    await screen.findByText('Cluster Kubernetes')

    expect(screen.getByText('Bientôt disponible')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Cluster Kubernetes'))

    expect(screen.getByTestId('pathname')).toHaveTextContent('/catalog')
    expect(screen.getByTestId('pathname')).not.toHaveTextContent('/catalog/k8s')
  })
})
