import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { TemplateDetailDTO } from '../../types/dto/TemplateDetailDTO'
import { CatalogDetailPage } from '../CatalogDetailPage'

const pgDetail: TemplateDetailDTO = {
  id: 'pg16',
  slug: 'postgresql',
  name: 'PostgreSQL',
  icon: 'database',
  category: 'database',
  provider: 'Docker',
  engine: 'docker',
  tags: ['SQL', 'Persistant'],
  description: 'Base relationnelle managée, backups & replicas.',
  popular: true,
  versions: [
    { version: '16', is_default: true, is_lts: false, eol_date: '2028-11-09' },
    { version: '15', is_default: false, is_lts: true, eol_date: null },
  ],
  params: [
    {
      key: 'db_name',
      label: 'Nom de la base',
      type: 'string',
      required: true,
      default_value: 'app',
      options: null,
      order_index: 0,
    },
    {
      key: 'password',
      label: 'Mot de passe',
      type: 'secret',
      required: true,
      default_value: null,
      options: null,
      order_index: 1,
    },
  ],
}

/** Page de config factice : révèle le `?template=` reçu pour vérifier le routing. */
function ConfigProbe() {
  const [params] = useSearchParams()
  return <div>Page de configuration de {params.get('template')}</div>
}

function renderDetail(initialId = 'pg16') {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[`/catalog/${initialId}`]}>
        <Routes>
          <Route path="/catalog/:id" element={<CatalogDetailPage />} />
          <Route path="/deployments/config" element={<ConfigProbe />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('CatalogDetailPage', () => {
  it('affiche l’en-tête, les versions et les paramètres du template', async () => {
    server.use(http.get('*/catalog/templates/pg16', () => HttpResponse.json(pgDetail)))

    renderDetail()

    expect(await screen.findByRole('heading', { name: 'PostgreSQL' })).toBeInTheDocument()
    expect(screen.getByText(/Base de données/)).toBeInTheDocument()
    // Versions
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    // Paramètres
    expect(screen.getByText('Nom de la base')).toBeInTheDocument()
    expect(screen.getByText('Mot de passe')).toBeInTheDocument()
  })

  it('le bouton « Déployer » mène à la configuration du template', async () => {
    server.use(http.get('*/catalog/templates/pg16', () => HttpResponse.json(pgDetail)))

    renderDetail()
    await screen.findByRole('heading', { name: 'PostgreSQL' })

    const deployButton = screen.getByRole('button', { name: /Déployer/ })
    expect(deployButton).toBeEnabled()

    await userEvent.click(deployButton)

    await waitFor(() => {
      expect(screen.getByText('Page de configuration de pg16')).toBeInTheDocument()
    })
  })

  it('affiche un état d’erreur honnête quand le template est introuvable', async () => {
    server.use(
      http.get('*/catalog/templates/missing', () => new HttpResponse(null, { status: 404 })),
    )

    renderDetail('missing')

    expect(await screen.findByText('Template introuvable')).toBeInTheDocument()
  })

  it('permet de revenir au catalogue', async () => {
    server.use(http.get('*/catalog/templates/pg16', () => HttpResponse.json(pgDetail)))

    renderDetail()
    const back = await screen.findByRole('link', { name: /Retour au catalogue/ })

    await userEvent.click(back)

    await waitFor(() => {
      expect(window.location.pathname).toBeDefined()
    })
    expect(back).toHaveAttribute('href', '/catalog')
  })
})
