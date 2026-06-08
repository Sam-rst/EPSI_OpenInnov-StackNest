import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { DeploymentDTO } from '../../types/dto/DeploymentDTO'
import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { useDeployment } from '../useDeployment'
import { useDeployments } from '../useDeployments'

function deploymentDto(overrides: Partial<DeploymentDTO> = {}): DeploymentDTO {
  return {
    id: 'dep-1',
    template_id: 'pg16',
    template_version: '16',
    name: 'ma-base',
    status: 'running',
    params: {},
    host: '10.0.0.5',
    published_port: 32769,
    access_url: '10.0.0.5:32769',
    created_at: '2026-06-07T09:12:00Z',
    updated_at: '2026-06-07T09:13:10Z',
    ...overrides,
  }
}

describe('useDeployments', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('charge la liste des déploiements via l’API', async () => {
    server.use(http.get('*/deployments', () => HttpResponse.json([deploymentDto()])))

    const { result } = renderHook(() => useDeployments(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.deployments).toHaveLength(1)
    expect(result.current.deployments[0]?.name).toBe('ma-base')
    expect(result.current.isError).toBe(false)
  })
})

describe('useDeployment', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('charge un déploiement par identifiant', async () => {
    server.use(http.get('*/deployments/dep-1', () => HttpResponse.json(deploymentDto())))

    const { result } = renderHook(() => useDeployment('dep-1'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.deployment?.id).toBe('dep-1')
    expect(result.current.deployment?.status).toBe(DeploymentStatus.RUNNING)
  })

  it('expose une erreur pour un identifiant inconnu (404)', async () => {
    server.use(http.get('*/deployments/inconnu', () => new HttpResponse(null, { status: 404 })))

    const { result } = renderHook(() => useDeployment('inconnu'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.deployment).toBeUndefined()
  })

  it('ne déclenche aucune requête sans identifiant', () => {
    const { result } = renderHook(() => useDeployment(undefined), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.deployment).toBeUndefined()
  })
})
