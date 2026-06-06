import { createContext } from 'react'

import type { AuthUser } from '../types/models/AuthUser'
import type { AuthSession } from '../types/models/AuthSession'

/**
 * État d'authentification partagé à toute l'application.
 *
 * `isInitializing` couvre la tentative de reconnexion silencieuse au boot
 * (refresh via cookie). Les routes protégées attendent la fin de cette phase
 * avant de décider d'une redirection. `setSession`/`clearSession` sont appelés
 * par les hooks de mutation (login/logout) pour synchroniser l'état.
 */
export interface AuthContextValue {
  isAuthenticated: boolean
  isInitializing: boolean
  user: AuthUser | null
  setSession: (session: AuthSession) => void
  clearSession: () => void
}

/**
 * Valeur par défaut (hors provider) : non authentifié, initialisation terminée,
 * actions no-op. Empêche les crashs si `useAuth` est appelé sans provider en test.
 */
export const defaultAuthValue: AuthContextValue = {
  isAuthenticated: false,
  isInitializing: false,
  user: null,
  setSession: () => undefined,
  clearSession: () => undefined,
}

export const AuthContext = createContext<AuthContextValue>(defaultAuthValue)
