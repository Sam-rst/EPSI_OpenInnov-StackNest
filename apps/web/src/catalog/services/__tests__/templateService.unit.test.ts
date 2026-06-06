import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import type { TemplateCardDTO } from '../../types/dto/TemplateCardDTO'
import type { TemplateDetailDTO } from '../../types/dto/TemplateDetailDTO'
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from '../templateService'

const pgCard: TemplateCardDTO = {
  id: 'pg16',
  slug: 'postgresql',
  name: 'PostgreSQL',
  icon: 'database',
  category: 'database',
  provider: 'Docker',
  tags: ['SQL'],
  description: 'Base relationnelle managée.',
  popular: true,
}

const pgDetail: TemplateDetailDTO = {
  ...pgCard,
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

describe('templateService.listTemplates', () => {
  it('appelle GET /catalog/templates et mappe les cartes en CatalogItem', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json([pgCard])))

    const items = await listTemplates()

    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('pg16')
    expect(items[0]?.name).toBe('PostgreSQL')
    expect(items[0]?.category).toBe('Base de données')
  })
})

describe('templateService.getTemplate', () => {
  it('appelle GET /catalog/templates/{id} et mappe vers TemplateDetail', async () => {
    server.use(http.get('*/catalog/templates/pg16', () => HttpResponse.json(pgDetail)))

    const detail = await getTemplate('pg16')

    expect(detail.slug).toBe('postgresql')
    expect(detail.categoryLabel).toBe('Base de données')
    expect(detail.versions).toHaveLength(1)
    expect(detail.params[0]?.key).toBe('db_name')
  })
})

describe('templateService.createTemplate', () => {
  it('POST /catalog/templates avec le payload et mappe la fiche créée', async () => {
    let received: unknown
    server.use(
      http.post('*/catalog/templates', async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(pgDetail, { status: 201 })
      }),
    )

    const detail = await createTemplate({
      slug: 'postgresql',
      name: 'PostgreSQL',
      icon: 'database',
      category: 'database',
      provider: 'Docker',
      description: 'Base relationnelle managée.',
      tags: ['SQL'],
      popular: true,
    })

    expect(detail.id).toBe('pg16')
    expect(received).toMatchObject({ slug: 'postgresql', name: 'PostgreSQL' })
  })
})

describe('templateService.updateTemplate', () => {
  it('PUT /catalog/templates/{id} et mappe la fiche mise à jour', async () => {
    server.use(http.put('*/catalog/templates/pg16', () => HttpResponse.json(pgDetail)))

    const detail = await updateTemplate('pg16', {
      slug: 'postgresql',
      name: 'PostgreSQL',
      icon: 'database',
      category: 'database',
      provider: 'Docker',
      description: 'Base relationnelle managée.',
      tags: ['SQL'],
      popular: true,
    })

    expect(detail.id).toBe('pg16')
  })
})

describe('templateService.deleteTemplate', () => {
  it('DELETE /catalog/templates/{id} (204 sans corps)', async () => {
    let called = false
    server.use(
      http.delete('*/catalog/templates/pg16', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await deleteTemplate('pg16')

    expect(called).toBe(true)
  })
})
