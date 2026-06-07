import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { setAccessToken, clearAccessToken } from '../../core/api/tokenStore'
import { AuthContext, defaultAuthValue, type AuthContextValue } from '../contexts/AuthContext'
import { authApi } from '../services/auth.api'
import type { AuthSession } from '../types/models/AuthSession'
import type { AuthUser } from '../types/models/AuthUser'

interface AuthProviderProps {
  /**
   * Valeur de contexte injectée (tests) : court-circuite la reconnexion au boot.
   * Accepte un override partiel, complété par les valeurs par défaut (non
   * authentifié, actions no-op), ce qui permet d'injecter juste `isAuthenticated`.
   */
  value?: Partial<AuthContextValue>
  children: ReactNode
}

/**
 * Fournit l'état d'authentification réel.
 *
 * Au montage, tente une reconnexion silencieuse : `POST /auth/refresh` (cookie
 * httpOnly) puis `GET /auth/me`. En cas de succès l'utilisateur est connecté ;
 * sinon l'état reste « non authentifié ». Les mutations login/logout
 * synchronisent l'état via `setSession`/`clearSession`.
 *
 * Une `value` explicite (tests) court-circuite toute cette logique.
 */
export function AuthProvider({ value, children }: AuthProviderProps) {
  const managed = useManagedAuth(value !== undefined)
  const resolved = value ? { ...defaultAuthValue, ...value } : managed
  return <AuthContext.Provider value={resolved}>{children}</AuthContext.Provider>
}

function useManagedAuth(disabled: boolean): AuthContextValue {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(!disabled)

  const setSession = useCallback((session: AuthSession) => {
    setAccessToken(session.accessToken)
    setUser(session.user)
  }, [])

  const clearSession = useCallback(() => {
    clearAccessToken()
    setUser(null)
  }, [])

  useEffect(() => {
    if (disabled) {
      return
    }

    let active = true
    void bootstrapSession()
      .then((bootUser) => {
        if (active) {
          setUser(bootUser)
        }
      })
      .finally(() => {
        if (active) {
          setIsInitializing(false)
        }
      })

    return () => {
      active = false
    }
  }, [disabled])

  return useMemo(
    () => ({
      isAuthenticated: user !== null,
      isInitializing,
      user,
      setSession,
      clearSession,
    }),
    [user, isInitializing, setSession, clearSession],
  )
}

/**
 * Tente de réhydrater une session depuis le cookie refresh. Renvoie l'utilisateur
 * si la reconnexion réussit, `null` sinon (aucune session valide).
 */
async function bootstrapSession(): Promise<AuthUser | null> {
  try {
    const accessToken = await authApi.refresh()
    setAccessToken(accessToken)
    return await authApi.me()
  } catch {
    clearAccessToken()
    return null
  }
}
