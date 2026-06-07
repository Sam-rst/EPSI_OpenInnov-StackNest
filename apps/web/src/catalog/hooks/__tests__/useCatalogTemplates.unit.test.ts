import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { TemplateCardDTO } from '../../types/dto/TemplateCardDTO'
import { useCatalogTemplates } from '../useCatalogTemplates'

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

describe('useCatalogTemplates', () => {
  it('démarre en chargement avec une liste vide', () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json([pgCard])))

    const { result } = renderHook(() => useCatalogTemplates(), { wrapper: createQueryWrapper() })

    expect(result.current.loading).toBe(true)
    expect(result.current.items).toEqual([])
  })

  it('charge les ressources via le service puis sort du chargement', async () => {
    server.use(http.get('*/catalog/templates', () => HttpResponse.json([pgCard])))

    const { result } = renderHook(() => useCatalogTemplates(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items.length).toBeGreaterThan(0)
    expect(result.current.items.some((item) => item.id === 'pg16')).toBe(true)
  })

  it('expose une erreur en cas d’échec API', async () => {
    server.use(http.get('*/catalog/templates', () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useCatalogTemplates(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.items).toEqual([])
  })
})
