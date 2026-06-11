import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { AuthContext } from '../../../auth/contexts/AuthContext'
import { server } from '../../../../tests/mocks/server'
import { buildAuthValue } from '../../../../tests/utils/authValue'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { TemplateCardDTO } from '../../types/dto/TemplateCardDTO'
import type { TemplateDetailDTO } from '../../types/dto/TemplateDetailDTO'
import { CatalogAdminPage } from '../CatalogAdminPage'

const pgCard: TemplateCardDTO = {
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
}

const createdDetail: TemplateDetailDTO = {
  id: 'redis7',
  slug: 'redis',
  name: 'Redis',
  icon: 'server',
  category: 'cache',
  provider: 'Docker',
  engine: 'docker',
  tags: ['Cache'],
  description: 'Store clé-valeur ultra-rapide pour cache.',
  popular: false,
  versions: [],
  params: [],
}

function renderAdmin(isAdmin: boolean) {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <AuthContext.Provider value={buildAuthValue({ isAdmin })}>
        <CatalogAdminPage />
      </AuthContext.Provider>
    </Wrapper>,
  )
}

describe('CatalogAdminPage', () => {
  it('refuse l’accès à un utilisateur non admin (403 honnête)', () => {
    renderAdmin(false)

    expect(screen.getByText('Accès réservé aux administrateurs')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Administration du catalogue/ })).toBeNull()
  })

  it('liste les templates existants pour un admin', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json([pgCard])))

    renderAdmin(true)

    expect(screen.getByRole('heading', { name: /Administration du catalogue/ })).toBeInTheDocument()
    expect(await screen.findByText('PostgreSQL')).toBeInTheDocument()
  })

  it('valide le formulaire et crée un template', async () => {
    let posted: unknown
    server.use(
      http.get('*/catalog/templates', () => HttpResponse.json([pgCard])),
      http.post('*/catalog/templates', async ({ request }) => {
        posted = await request.json()
        return HttpResponse.json(createdDetail, { status: 201 })
      }),
    )

    renderAdmin(true)
    await screen.findByText('PostgreSQL')

    await userEvent.type(screen.getByLabelText('Slug'), 'redis')
    await userEvent.type(screen.getByLabelText('Nom'), 'Redis')
    await userEvent.type(screen.getByLabelText('Icône (lucide)'), 'server')
    await userEvent.type(screen.getByLabelText('Provider'), 'Docker')
    await userEvent.type(
      screen.getByLabelText('Description'),
      'Store clé-valeur ultra-rapide pour cache.',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Créer le template' }))

    await waitFor(() => {
      expect(posted).toMatchObject({ slug: 'redis', name: 'Redis' })
    })
  })

  it('affiche les erreurs de validation et n’appelle pas l’API', async () => {
    let postCalled = false
    server.use(
      http.get('*/catalog/templates', () => HttpResponse.json([pgCard])),
      http.post('*/catalog/templates', () => {
        postCalled = true
        return HttpResponse.json(createdDetail, { status: 201 })
      }),
    )

    renderAdmin(true)
    await screen.findByText('PostgreSQL')

    await userEvent.click(screen.getByRole('button', { name: 'Créer le template' }))

    const errors = await screen.findAllByText(/au moins 2 caractères/)
    expect(errors.length).toBeGreaterThan(0)
    expect(postCalled).toBe(false)
  })

  it('supprime un template existant', async () => {
    let deleteCalled = false
    server.use(
      http.get('*/catalog/templates', () => HttpResponse.json([pgCard])),
      http.delete('*/catalog/templates/pg16', () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderAdmin(true)
    const row = (await screen.findByText('PostgreSQL')).closest('li') as HTMLElement

    await userEvent.click(within(row).getByRole('button', { name: 'Supprimer' }))

    await waitFor(() => {
      expect(deleteCalled).toBe(true)
    })
  })
})
