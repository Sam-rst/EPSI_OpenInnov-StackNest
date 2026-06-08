import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { DeploymentStep } from '../../types/enums/DeploymentStep'
import { useDeploymentEvents } from '../useDeploymentEvents'

describe('useDeploymentEvents (SSE simulé)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('démarre vide puis accumule les logs au fil de la progression simulée', () => {
    const { result } = renderHook(() => useDeploymentEvents('exemple-pg'))

    expect(result.current.logs).toHaveLength(0)
    expect(result.current.isDone).toBe(false)
    expect(result.current.currentStep).toBe(DeploymentStep.VALIDATION)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.logs.length).toBeGreaterThan(0)
    expect(result.current.logs.every((line) => line.message.includes('exemple'))).toBe(true)
  })

  it('atteint l’état running, révèle les accès une fois et termine', () => {
    const { result } = renderHook(() => useDeploymentEvents('exemple-pg'))

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(result.current.status).toBe(DeploymentStatus.RUNNING)
    expect(result.current.currentStep).toBe(DeploymentStep.READY)
    expect(result.current.isDone).toBe(true)
    expect(result.current.access?.password).toContain('exemple')
  })

  it('reste inactif tant qu’aucun identifiant n’est fourni', () => {
    const { result } = renderHook(() => useDeploymentEvents(undefined))

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(result.current.logs).toHaveLength(0)
    expect(result.current.isDone).toBe(false)
  })
})
