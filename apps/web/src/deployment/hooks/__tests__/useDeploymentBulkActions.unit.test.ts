import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { BulkAction } from '../../types/enums/BulkAction'
import type { Deployment } from '../../types/models/Deployment'
import { useDeploymentBulkActions } from '../useDeploymentBulkActions'

function deployment(overrides: Partial<Deployment> = {}): Deployment {
  return {
    id: 'dep-1',
    templateId: 'pg16',
    templateName: 'PostgreSQL',
    version: '16',
    name: 'postgres-prod',
    status: DeploymentStatus.RUNNING,
    statusLabel: 'En ligne',
    params: {},
    host: '10.0.0.5',
    port: 32769,
    accessUrl: '10.0.0.5:32769',
    connectionUsername: 'postgres',
    createdAt: '2026-06-07T09:12:00Z',
    updatedAt: '2026-06-07T09:13:10Z',
    ...overrides,
  }
}

const DEPLOYMENTS: readonly Deployment[] = [
  deployment(),
  deployment({ id: 'dep-2', name: 'redis', status: DeploymentStatus.STOPPED }),
]

describe('useDeploymentBulkActions', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('expose une API de sélection et masque la barre tant que rien n’est sélectionné', () => {
    const { result } = renderHook(() => useDeploymentBulkActions(DEPLOYMENTS), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.selection.count).toBe(0)
    expect(result.current.availability).toEqual({
      canStart: false,
      canStop: false,
      canDestroy: false,
    })
  })

  it('calcule la disponibilité « au mieux » sur la sélection courante', () => {
    const { result } = renderHook(() => useDeploymentBulkActions(DEPLOYMENTS), {
      wrapper: createQueryWrapper(),
    })

    act(() => result.current.selection.toggle('dep-2')) // stopped → start + destroy

    expect(result.current.availability.canStart).toBe(true)
    expect(result.current.availability.canStop).toBe(false)
    expect(result.current.availability.canDestroy).toBe(true)
  })

  it('exécute une action sur la sélection, vide la sélection et publie le retour', async () => {
    const stopped: string[] = []
    server.use(
      http.post('*/deployments/:id/stop', ({ params }) => {
        stopped.push(params.id as string)
        return new HttpResponse(null, { status: 202 })
      }),
    )

    const { result } = renderHook(() => useDeploymentBulkActions(DEPLOYMENTS), {
      wrapper: createQueryWrapper(),
    })

    act(() => result.current.selection.selectAll())
    await act(async () => {
      await result.current.runAction(BulkAction.STOP)
    })

    expect(stopped).toEqual(expect.arrayContaining(['dep-1', 'dep-2']))

    await waitFor(() => {
      expect(result.current.feedback?.tone).toBe('success')
    })
    expect(result.current.selection.count).toBe(0)
  })

  it('permet de fermer le retour', async () => {
    server.use(http.post('*/deployments/:id/stop', () => new HttpResponse(null, { status: 202 })))

    const { result } = renderHook(() => useDeploymentBulkActions(DEPLOYMENTS), {
      wrapper: createQueryWrapper(),
    })

    act(() => result.current.selection.toggle('dep-1'))
    await act(async () => {
      await result.current.runAction(BulkAction.STOP)
    })
    await waitFor(() => {
      expect(result.current.feedback).not.toBeNull()
    })

    act(() => result.current.dismissFeedback())
    expect(result.current.feedback).toBeNull()
  })
})
