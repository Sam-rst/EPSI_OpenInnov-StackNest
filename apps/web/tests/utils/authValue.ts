import { defaultAuthValue, type AuthContextValue } from '../../src/auth/contexts/AuthContext'
import type { AuthUser } from '../../src/auth/types/models/AuthUser'

interface BuildAuthOptions {
  isAuthenticated?: boolean
  isAdmin?: boolean
}

/**
 * Construit une valeur `AuthContextValue` complète pour les tests qui montent
 * `AuthContext.Provider` directement (sans passer par `AuthProvider`). Évite de
 * dupliquer la forme du contexte (user, isInitializing, actions no-op) à chaque
 * test et garde l'alignement sur le vrai contexte (rôle dérivé de `user.isAdmin`).
 */
export function buildAuthValue(options: BuildAuthOptions = {}): AuthContextValue {
  const isAuthenticated = options.isAuthenticated ?? true
  const isAdmin = options.isAdmin ?? false
  const user: AuthUser | null = isAuthenticated
    ? {
        id: 'usr-test',
        email: 'qa@stacknest.local',
        role: isAdmin ? 'admin' : 'user',
        isVerified: true,
        isAdmin,
      }
    : null
  return { ...defaultAuthValue, isAuthenticated, user }
}
