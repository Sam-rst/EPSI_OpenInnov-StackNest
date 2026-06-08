import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { useDeploymentActions } from '../useDeploymentActions'

describe('useDeploymentActions (stubs display-only)', () => {
  it('expose les quatre actions de cycle de vie', () => {
    const { result } = renderHook(() => useDeploymentActions('exemple-pg'), {
      wrapper: createQueryWrapper(),
    })

    expect(typeof result.current.stop.mutate).toBe('function')
    expect(typeof result.current.start.mutate).toBe('function')
    expect(typeof result.current.destroy.mutate).toBe('function')
    expect(typeof result.current.regeneratePassword.mutate).toBe('function')
  })

  it('résout une action sans erreur en display-only', async () => {
    const { result } = renderHook(() => useDeploymentActions('exemple-pg'), {
      wrapper: createQueryWrapper(),
    })

    result.current.stop.mutate()

    await waitFor(() => {
      expect(result.current.stop.isSuccess).toBe(true)
    })
  })
})
