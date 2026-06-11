import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { StackDTO } from '../../types/dto/StackDTO'
import { StackStatus } from '../../types/enums/StackStatus'
import { useStack } from '../useStack'
import { useStacks } from '../useStacks'

function stackDto(overrides: Partial<StackDTO> = {}): StackDTO {
  return {
    id: 'stack-1',
    owner_id: 'user-1',
    name: 'ma-stack',
    status: 'running',
    created_at: '2026-06-11T09:00:00Z',
    updated_at: '2026-06-11T09:05:00Z',
    ...overrides,
  }
}

describe('useStacks', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('charge la liste des stacks via l’API', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([stackDto()])))

    const { result } = renderHook(() => useStacks(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stacks).toHaveLength(1)
    expect(result.current.stacks[0]?.name).toBe('ma-stack')
    expect(result.current.isError).toBe(false)
  })

  it('expose une erreur quand l’API échoue', async () => {
    server.use(http.get('*/stacks', () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useStacks(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.stacks).toHaveLength(0)
  })
})

describe('useStack', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('charge le détail d’une stack par identifiant', async () => {
    server.use(http.get('*/stacks/stack-1', () => HttpResponse.json(stackDto({ services: [] }))))

    const { result } = renderHook(() => useStack('stack-1'), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stack?.id).toBe('stack-1')
    expect(result.current.stack?.status).toBe(StackStatus.RUNNING)
  })

  it('ne déclenche aucune requête sans identifiant', () => {
    const { result } = renderHook(() => useStack(undefined), { wrapper: createQueryWrapper() })

    expect(result.current.loading).toBe(false)
    expect(result.current.stack).toBeUndefined()
  })
})
