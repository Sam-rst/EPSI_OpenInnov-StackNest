import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { TemplateConfigDTO } from '../../types/dto/TemplateConfigDTO'
import { EngineKind } from '../../types/enums/EngineKind'
import { useTemplateConfig } from '../useTemplateConfig'

const pgConfig: TemplateConfigDTO = {
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

describe('useTemplateConfig', () => {
  it('charge et mappe la fiche de configuration', async () => {
    server.use(http.get('*/catalog/templates/pg16', () => HttpResponse.json(pgConfig)))

    const { result } = renderHook(() => useTemplateConfig('pg16'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.template?.engine).toBe(EngineKind.DOCKER)
    expect(result.current.template?.imageRepository).toBe('postgres')
    expect(result.current.isError).toBe(false)
  })

  it('expose une erreur en cas d’échec (404)', async () => {
    server.use(
      http.get('*/catalog/templates/missing', () => new HttpResponse(null, { status: 404 })),
    )

    const { result } = renderHook(() => useTemplateConfig('missing'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.template).toBeUndefined()
  })
})
