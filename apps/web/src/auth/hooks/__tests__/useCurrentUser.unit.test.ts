import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCurrentUser } from '../useCurrentUser'

const FICTIONAL_NAMES = ['John Doe', 'Yassine', 'Antony', 'Remi', 'Thomas', 'Mahe', 'Julien']

describe('useCurrentUser', () => {
  it('renvoie un utilisateur neutre/anonyme (aucune identité fictive)', () => {
    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.name).toBe('Utilisateur')
    for (const fictional of FICTIONAL_NAMES) {
      expect(result.current.name).not.toContain(fictional)
      expect(result.current.role).not.toContain(fictional)
    }
  })

  it('expose un rôle neutre et un identifiant', () => {
    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.role).toBe('Session locale')
    expect(result.current.id).toBeTruthy()
  })
})
