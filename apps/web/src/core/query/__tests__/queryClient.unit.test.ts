import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { createQueryClient, queryClient } from '../queryClient'

describe('createQueryClient', () => {
  it('retourne une instance de QueryClient', () => {
    const client = createQueryClient()

    expect(client).toBeInstanceOf(QueryClient)
  })

  it('configure un staleTime et un retry raisonnables sur les requêtes', () => {
    const client = createQueryClient()

    const { queries } = client.getDefaultOptions()

    expect(queries?.staleTime).toBeGreaterThan(0)
    expect(queries?.retry).toBe(1)
    expect(queries?.refetchOnWindowFocus).toBe(false)
  })
})

describe('queryClient (singleton partagé)', () => {
  it("expose une instance prête à l'emploi", () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })
})
