import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { useDeploymentActions } from '../useDeploymentActions'

describe('useDeploymentActions (API REST)', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('expose les quatre actions de cycle de vie', () => {
    const { result } = renderHook(() => useDeploymentActions('dep-1'), {
      wrapper: createQueryWrapper(),
    })

    expect(typeof result.current.stop.mutate).toBe('function')
    expect(typeof result.current.start.mutate).toBe('function')
    expect(typeof result.current.destroy.mutate).toBe('function')
    expect(typeof result.current.regeneratePassword.mutate).toBe('function')
  })

  it('résout l’action stop (202) avec succès', async () => {
    server.use(http.post('*/deployments/dep-1/stop', () => new HttpResponse(null, { status: 202 })))

    const { result } = renderHook(() => useDeploymentActions('dep-1'), {
      wrapper: createQueryWrapper(),
    })

    result.current.stop.mutate()

    await waitFor(() => {
      expect(result.current.stop.isSuccess).toBe(true)
    })
  })

  it('remonte l’échec d’une action (409)', async () => {
    server.use(
      http.post('*/deployments/dep-1/start', () => new HttpResponse(null, { status: 409 })),
    )

    const { result } = renderHook(() => useDeploymentActions('dep-1'), {
      wrapper: createQueryWrapper(),
    })

    result.current.start.mutate()

    await waitFor(() => {
      expect(result.current.start.isError).toBe(true)
    })
  })
})
