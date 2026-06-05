import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCurrentWorkspace } from '../useCurrentWorkspace'

describe('useCurrentWorkspace', () => {
  it('renvoie l’espace neutre du produit (aucun nom de workspace inventé)', () => {
    const { result } = renderHook(() => useCurrentWorkspace())

    // « StackNest » est le nom du produit, pas un workspace fictif comme « StackNest Lab ».
    expect(result.current.name).toBe('StackNest')
    expect(result.current.name).not.toContain('Lab')
  })

  it('expose un plan neutre (aucune facturation inventée) et des initiales', () => {
    const { result } = renderHook(() => useCurrentWorkspace())

    expect(result.current.plan).toBe('local')
    expect(result.current.plan).not.toBe('Team')
    expect(result.current.initials).toBe('SN')
  })
})
