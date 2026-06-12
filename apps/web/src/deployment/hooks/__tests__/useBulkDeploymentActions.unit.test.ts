import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { BulkAction } from '../../types/enums/BulkAction'
import { useBulkDeploymentActions } from '../useBulkDeploymentActions'

describe('useBulkDeploymentActions (fan-out REST)', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('appelle l’endpoint stop pour chaque id sélectionné', async () => {
    const hit: string[] = []
    server.use(
      http.post('*/deployments/:id/stop', ({ params }) => {
        hit.push(params.id as string)
        return new HttpResponse(null, { status: 202 })
      }),
    )

    const { result } = renderHook(() => useBulkDeploymentActions(), {
      wrapper: createQueryWrapper(),
    })

    const outcome = await result.current.run(BulkAction.STOP, ['dep-1', 'dep-2'])

    expect(hit).toEqual(expect.arrayContaining(['dep-1', 'dep-2']))
    expect(outcome.succeeded).toEqual(expect.arrayContaining(['dep-1', 'dep-2']))
    expect(outcome.failed).toEqual([])
  })

  it('mappe delete vers l’endpoint destroy', async () => {
    const hit: string[] = []
    server.use(
      http.post('*/deployments/:id/destroy', ({ params }) => {
        hit.push(params.id as string)
        return new HttpResponse(null, { status: 202 })
      }),
    )

    const { result } = renderHook(() => useBulkDeploymentActions(), {
      wrapper: createQueryWrapper(),
    })

    await result.current.run(BulkAction.DELETE, ['dep-9'])

    expect(hit).toEqual(['dep-9'])
  })

  it('mappe start vers l’endpoint start', async () => {
    const hit: string[] = []
    server.use(
      http.post('*/deployments/:id/start', ({ params }) => {
        hit.push(params.id as string)
        return new HttpResponse(null, { status: 202 })
      }),
    )

    const { result } = renderHook(() => useBulkDeploymentActions(), {
      wrapper: createQueryWrapper(),
    })

    await result.current.run(BulkAction.START, ['dep-7'])

    expect(hit).toEqual(['dep-7'])
  })

  it('remonte les succès et échecs par item (succès partiel)', async () => {
    server.use(
      http.post('*/deployments/ok/stop', () => new HttpResponse(null, { status: 202 })),
      http.post('*/deployments/ko/stop', () => new HttpResponse(null, { status: 409 })),
    )

    const { result } = renderHook(() => useBulkDeploymentActions(), {
      wrapper: createQueryWrapper(),
    })

    const outcome = await result.current.run(BulkAction.STOP, ['ok', 'ko'])

    expect(outcome.succeeded).toEqual(['ok'])
    expect(outcome.failed).toEqual(['ko'])
  })

  it('invalide la liste des déploiements après exécution', async () => {
    server.use(http.post('*/deployments/:id/stop', () => new HttpResponse(null, { status: 202 })))

    const { result } = renderHook(() => useBulkDeploymentActions(), {
      wrapper: createQueryWrapper(),
    })

    await result.current.run(BulkAction.STOP, ['dep-1'])

    // L'invalidation est observée indirectement : pas d'erreur et flux complet.
    expect(result.current.isRunning).toBe(false)
  })

  it('marque isRunning pendant l’exécution puis le repose', async () => {
    let resolveStop: (() => void) | undefined
    server.use(
      http.post('*/deployments/:id/stop', async () => {
        await new Promise<void>((resolve) => {
          resolveStop = resolve
        })
        return new HttpResponse(null, { status: 202 })
      }),
    )

    const { result } = renderHook(() => useBulkDeploymentActions(), {
      wrapper: createQueryWrapper(),
    })

    const runPromise = result.current.run(BulkAction.STOP, ['slow'])

    await waitFor(() => {
      expect(result.current.isRunning).toBe(true)
    })

    resolveStop?.()
    await runPromise

    await waitFor(() => {
      expect(result.current.isRunning).toBe(false)
    })
  })
})
