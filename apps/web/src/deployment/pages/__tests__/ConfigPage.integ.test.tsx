import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { TemplateConfigDTO } from '../../types/dto/TemplateConfigDTO'
import { ConfigPage } from '../ConfigPage'

const dockerTemplate: TemplateConfigDTO = {
  id: 'pg16',
  name: 'PostgreSQL',
  icon: 'database',
  description: 'Base relationnelle managée.',
  engine: 'docker',
  image_repository: 'postgres',
  internal_port: 5432,
  secret_env: 'POSTGRES_PASSWORD',
  versions: [{ version: '16', is_default: true, is_lts: false, eol_date: null }],
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
  ],
}

const terraformTemplate: TemplateConfigDTO = {
  ...dockerTemplate,
  id: 'bucket',
  name: 'Bucket S3',
  icon: 'database',
  engine: 'terraform',
  image_repository: null,
  internal_port: null,
  secret_env: null,
  params: [],
}

function renderConfig(query: string) {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[`/deployments/config${query}`]}>
        <Routes>
          <Route path="/deployments/config" element={<ConfigPage />} />
          <Route path="/deployments/:id" element={<div>Page de suivi</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('ConfigPage (engine-aware)', () => {
  it('rend le formulaire Docker + l’aperçu conteneur pour un template docker', async () => {
    server.use(http.get('*/catalog/templates/pg16', () => HttpResponse.json(dockerTemplate)))

    renderConfig('?template=pg16')

    expect(
      await screen.findByRole('heading', { name: /Configurer PostgreSQL/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Identité')).toBeInTheDocument()
    expect(screen.getByText('Capacité')).toBeInTheDocument()
    expect(screen.getByText('aperçu Docker')).toBeInTheDocument()
    // L'aperçu masque le secret (aucune valeur réelle).
    expect(screen.getByText(/POSTGRES_PASSWORD=••••/)).toBeInTheDocument()
  })

  it('affiche l’écran « Terraform à venir » pour un template terraform', async () => {
    server.use(http.get('*/catalog/templates/bucket', () => HttpResponse.json(terraformTemplate)))

    renderConfig('?template=bucket')

    expect(await screen.findByText('Déploiement Terraform à venir')).toBeInTheDocument()
    expect(screen.queryByText('Identité')).not.toBeInTheDocument()
    expect(screen.queryByText('aperçu Docker')).not.toBeInTheDocument()
  })

  it('déploie après saisie d’un nom (POST /deployments) et navigue vers la page de suivi', async () => {
    server.use(
      http.get('*/catalog/templates/pg16', () => HttpResponse.json(dockerTemplate)),
      http.post('*/deployments', () =>
        HttpResponse.json(
          {
            id: 'dep-new',
            template_id: 'pg16',
            template_version: '16',
            name: 'ma-base',
            status: 'pending',
            params: {},
            host: null,
            published_port: null,
            access_url: null,
            created_at: null,
            updated_at: null,
          },
          { status: 201 },
        ),
      ),
    )

    renderConfig('?template=pg16')
    await screen.findByRole('heading', { name: /Configurer PostgreSQL/ })

    const deployButton = screen.getByRole('button', { name: /Déployer/ })
    expect(deployButton).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText('ex. ma-base'), 'ma-base')
    expect(deployButton).toBeEnabled()

    await userEvent.click(deployButton)

    await waitFor(() => {
      expect(screen.getByText('Page de suivi')).toBeInTheDocument()
    })
  })

  it('affiche une erreur inline et garde le bouton bloqué pour un nom invalide', async () => {
    server.use(http.get('*/catalog/templates/pg16', () => HttpResponse.json(dockerTemplate)))

    renderConfig('?template=pg16')
    await screen.findByRole('heading', { name: /Configurer PostgreSQL/ })

    const deployButton = screen.getByRole('button', { name: /Déployer/ })
    await userEvent.type(screen.getByPlaceholderText('ex. ma-base'), 'Ma Base')

    // Le format invalide est expliqué inline et le bouton reste bloqué (#3 #5).
    expect(await screen.findByText(/Minuscules, chiffres et tirets/)).toBeInTheDocument()
    expect(deployButton).toBeDisabled()
  })

  it('affiche le message d’erreur de l’API quand le déploiement échoue (409)', async () => {
    server.use(
      http.get('*/catalog/templates/pg16', () => HttpResponse.json(dockerTemplate)),
      http.post('*/deployments', () =>
        HttpResponse.json(
          { error: 'deployment_name_taken', message: 'Ce nom est déjà utilisé.' },
          { status: 409 },
        ),
      ),
    )

    renderConfig('?template=pg16')
    await screen.findByRole('heading', { name: /Configurer PostgreSQL/ })

    await userEvent.type(screen.getByPlaceholderText('ex. ma-base'), 'ma-base')
    await userEvent.click(screen.getByRole('button', { name: /Déployer/ }))

    // L'échec n'est plus silencieux : le message API est visible (#1).
    expect(await screen.findByText('Ce nom est déjà utilisé.')).toBeInTheDocument()
  })

  it('affiche un état honnête quand le template est introuvable', async () => {
    server.use(
      http.get('*/catalog/templates/missing', () => new HttpResponse(null, { status: 404 })),
    )

    renderConfig('?template=missing')

    expect(await screen.findByText('Template introuvable')).toBeInTheDocument()
  })

  it('invite à choisir un template quand aucun n’est passé', () => {
    renderConfig('')

    expect(screen.getByText('Aucun template sélectionné')).toBeInTheDocument()
  })
})
