import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { TemplateDetailDTO } from '../../types/dto/TemplateDetailDTO'
import { useTemplateDetail } from '../useTemplateDetail'

const pgDetail: TemplateDetailDTO = {
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

describe('useTemplateDetail', () => {
  it('charge et mappe la fiche détaillée', async () => {
    server.use(http.get('*/catalog/templates/pg16', () => HttpResponse.json(pgDetail)))

    const { result } = renderHook(() => useTemplateDetail('pg16'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.detail?.name).toBe('PostgreSQL')
    expect(result.current.detail?.categoryLabel).toBe('Base de données')
    expect(result.current.isError).toBe(false)
  })

  it('expose une erreur en cas d’échec (404)', async () => {
    server.use(
      http.get('*/catalog/templates/missing', () => new HttpResponse(null, { status: 404 })),
    )

    const { result } = renderHook(() => useTemplateDetail('missing'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.detail).toBeUndefined()
  })

  it('ne déclenche aucune requête sans identifiant', () => {
    const { result } = renderHook(() => useTemplateDetail(undefined), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.detail).toBeUndefined()
  })
})
