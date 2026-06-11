import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { TemplateDetailDTO } from '../../types/dto/TemplateDetailDTO'
import type { TemplateWriteDTO } from '../../types/dto/TemplateWriteDTO'
import { useTemplateMutations } from '../useTemplateMutations'

const payload: TemplateWriteDTO = {
  slug: 'postgresql',
  name: 'PostgreSQL',
  icon: 'database',
  category: 'database',
  provider: 'Docker',
  description: 'Base relationnelle managée.',
  tags: ['SQL'],
  popular: true,
}

const detail: TemplateDetailDTO = {
  ...payload,
  id: 'pg16',
  engine: 'docker',
  versions: [],
  params: [],
}

describe('useTemplateMutations', () => {
  it('crée un template via la mutation create', async () => {
    server.use(http.post('*/catalog/templates', () => HttpResponse.json(detail, { status: 201 })))

    const { result } = renderHook(() => useTemplateMutations(), { wrapper: createQueryWrapper() })

    const created = await result.current.create.mutateAsync(payload)

    expect(created.id).toBe('pg16')
  })

  it('met à jour un template via la mutation update', async () => {
    server.use(http.put('*/catalog/templates/pg16', () => HttpResponse.json(detail)))

    const { result } = renderHook(() => useTemplateMutations(), { wrapper: createQueryWrapper() })

    const updated = await result.current.update.mutateAsync({ id: 'pg16', payload })

    expect(updated.name).toBe('PostgreSQL')
  })

  it('supprime un template via la mutation remove', async () => {
    let called = false
    server.use(
      http.delete('*/catalog/templates/pg16', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { result } = renderHook(() => useTemplateMutations(), { wrapper: createQueryWrapper() })

    await result.current.remove.mutateAsync('pg16')

    await waitFor(() => {
      expect(called).toBe(true)
    })
  })
})
