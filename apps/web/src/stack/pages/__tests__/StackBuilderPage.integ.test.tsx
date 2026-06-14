import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { BETA_BANNER_TEXT } from '../../../shared/components/BetaBanner'
import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { StackBuilderPage } from '../StackBuilderPage'

/** Carte catalogue (miroir `TemplateCardDTO`). */
function cardDto(id: string, name: string, engine = 'docker', extra: Record<string, unknown> = {}) {
  return {
    id,
    slug: id,
    name,
    icon: 'database',
    category: 'database',
    provider: 'Docker',
    engine,
    tags: [],
    description: `${name} service`,
    popular: false,
    ...extra,
  }
}

/** Fiche config (miroir `TemplateConfigDTO`). */
function configDto(id: string, name: string) {
  return {
    id,
    name,
    icon: 'database',
    description: '',
    engine: 'docker',
    image_repository: id,
    internal_port: 5432,
    secret_env: 'POSTGRES_PASSWORD',
    versions: [{ version: '16', is_default: true, is_lts: true, eol_date: null }],
    params: [
      {
        key: 'db_name',
        label: 'Base',
        type: 'string',
        required: true,
        default_value: 'app',
        options: null,
        order_index: 0,
      },
    ],
  }
}

function renderBuilder() {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/stacks/new']}>
        <Routes>
          <Route path="/stacks/new" element={<StackBuilderPage />} />
          <Route path="/stacks/:id" element={<div>Détail stack créée</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('StackBuilderPage', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('affiche un rappel bêta honnête en tête du composeur', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json([])))

    renderBuilder()

    expect(await screen.findByText(BETA_BANNER_TEXT)).toBeInTheDocument()
  })

  it('ne propose que les services Docker (Terraform exclus)', async () => {
    server.use(
      http.get('*/catalog/templates', () =>
        HttpResponse.json([
          cardDto('pg16', 'PostgreSQL'),
          cardDto('vm', 'VM Proxmox', 'terraform'),
        ]),
      ),
    )

    renderBuilder()

    expect(await screen.findByText('PostgreSQL')).toBeInTheDocument()
    // Les templates Terraform (bloqués) ne sont pas composables en stack.
    expect(screen.queryByText('VM Proxmox')).toBeNull()
  })

  it('ajoute un service, le nomme et déploie → POST /stacks puis redirige', async () => {
    server.use(
      http.get('*/catalog/templates', () => HttpResponse.json([cardDto('pg16', 'PostgreSQL')])),
      http.get('*/catalog/templates/pg16', () =>
        HttpResponse.json(configDto('pg16', 'PostgreSQL')),
      ),
    )
    let body: Record<string, unknown> | undefined
    server.use(
      http.post('*/stacks', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          { id: 'stack-new', owner_id: 'u1', name: 'ma-stack', status: 'pending' },
          { status: 201 },
        )
      }),
    )

    renderBuilder()
    await userEvent.click(await screen.findByText('PostgreSQL'))

    // Le bloc apparaît avec l'alias dérivé.
    const aliasInput = await screen.findByLabelText(/Alias du service PostgreSQL/i)
    expect((aliasInput as HTMLInputElement).value).toBe('postgresql')

    await userEvent.type(screen.getByLabelText('Nom de la stack'), 'ma-stack')
    await userEvent.click(screen.getByRole('button', { name: /Déployer la stack/i }))

    expect(await screen.findByText('Détail stack créée')).toBeInTheDocument()
    expect(body?.name).toBe('ma-stack')
    expect((body?.services as unknown[]).length).toBe(1)
  })

  it('filtre les services proposés via la recherche', async () => {
    server.use(
      http.get('*/catalog/templates', () =>
        HttpResponse.json([cardDto('pg16', 'PostgreSQL'), cardDto('redis', 'Redis')]),
      ),
    )

    renderBuilder()
    await screen.findByText('PostgreSQL')
    expect(screen.getByText('Redis')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Rechercher un service'), 'redis')

    expect(screen.getByText('Redis')).toBeInTheDocument()
    expect(screen.queryByText('PostgreSQL')).toBeNull()
  })

  it('restreint aux services populaires', async () => {
    server.use(
      http.get('*/catalog/templates', () =>
        HttpResponse.json([
          cardDto('pg16', 'PostgreSQL', 'docker', { popular: true }),
          cardDto('redis', 'Redis', 'docker', { popular: false }),
        ]),
      ),
    )

    renderBuilder()
    await screen.findByText('PostgreSQL')

    await userEvent.click(screen.getByLabelText('Populaires uniquement'))

    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    expect(screen.queryByText('Redis')).toBeNull()
  })

  it('affiche un message quand aucun service ne correspond aux filtres', async () => {
    server.use(
      http.get('*/catalog/templates', () => HttpResponse.json([cardDto('pg16', 'PostgreSQL')])),
    )

    renderBuilder()
    await screen.findByText('PostgreSQL')

    await userEvent.type(screen.getByLabelText('Rechercher un service'), 'zzz')

    expect(screen.getByText('Aucun service ne correspond aux filtres.')).toBeInTheDocument()
  })

  it('bloque le déploiement tant qu’aucun service n’est ajouté', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json([])))

    renderBuilder()

    const deploy = await screen.findByRole('button', { name: /Déployer la stack/i })
    expect(deploy).toBeDisabled()
    expect(screen.getByText('Stack vide')).toBeInTheDocument()
  })
})
