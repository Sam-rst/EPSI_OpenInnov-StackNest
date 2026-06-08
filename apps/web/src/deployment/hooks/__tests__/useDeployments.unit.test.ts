import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { useDeployment } from '../useDeployment'
import { useDeployments } from '../useDeployments'

describe('useDeployments', () => {
  it('charge la liste des déploiements d’exemple', async () => {
    const { result } = renderHook(() => useDeployments(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.deployments.length).toBeGreaterThan(0)
    expect(result.current.isError).toBe(false)
  })
})

describe('useDeployment', () => {
  it('charge un déploiement d’exemple par identifiant', async () => {
    const { result } = renderHook(() => useDeployment('exemple-pg'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.deployment?.id).toBe('exemple-pg')
    expect(result.current.deployment?.status).toBe(DeploymentStatus.RUNNING)
  })

  it('expose une erreur pour un identifiant inconnu', async () => {
    const { result } = renderHook(() => useDeployment('introuvable'), {
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
