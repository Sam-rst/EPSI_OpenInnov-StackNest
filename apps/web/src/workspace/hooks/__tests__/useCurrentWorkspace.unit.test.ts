import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCurrentWorkspace } from '../useCurrentWorkspace'

describe('useCurrentWorkspace', () => {
  it('renvoie l’espace de démo « StackNest Lab » (plan Team)', () => {
    const { result } = renderHook(() => useCurrentWorkspace())

    expect(result.current.name).toBe('StackNest Lab')
    expect(result.current.plan).toBe('Team')
  })

  it('expose des initiales pour la pastille', () => {
    const { result } = renderHook(() => useCurrentWorkspace())

    expect(result.current.initials).toBe('SN')
  })
})
