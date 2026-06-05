import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCatalogTemplates } from '../useCatalogTemplates'

describe('useCatalogTemplates', () => {
  it('démarre en chargement avec une liste vide', () => {
    const { result } = renderHook(() => useCatalogTemplates())

    expect(result.current.loading).toBe(true)
    expect(result.current.items).toEqual([])
  })

  it('charge les ressources via le service puis sort du chargement', async () => {
    const { result } = renderHook(() => useCatalogTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items.length).toBeGreaterThan(0)
    expect(result.current.items.some((item) => item.id === 'pg16')).toBe(true)
  })
})
