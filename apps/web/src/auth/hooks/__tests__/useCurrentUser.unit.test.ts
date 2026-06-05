import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCurrentUser } from '../useCurrentUser'

describe('useCurrentUser', () => {
  it('renvoie l’utilisateur de démo « John Doe »', () => {
    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.name).toBe('John Doe')
  })

  it('expose un rôle et un identifiant', () => {
    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.role).toBe('Owner · Admin · Plateforme')
    expect(result.current.id).toBeTruthy()
  })
})
