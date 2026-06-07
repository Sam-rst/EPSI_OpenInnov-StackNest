import { createElement, type ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext'
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

  it("mappe l'utilisateur authentifié de l'AuthContext (email + rôle)", () => {
    const value: AuthContextValue = {
      isAuthenticated: true,
      isInitializing: false,
      user: {
        id: 'usr_42',
        email: 'admin@stacknest.local',
        role: 'admin',
        isVerified: true,
        isAdmin: true,
      },
      setSession: () => undefined,
      clearSession: () => undefined,
    }
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(AuthContext.Provider, { value }, children)

    const { result } = renderHook(() => useCurrentUser(), { wrapper })

    expect(result.current.id).toBe('usr_42')
    expect(result.current.name).toBe('admin@stacknest.local')
    expect(result.current.role).toBe('Administrateur')
  })
})
