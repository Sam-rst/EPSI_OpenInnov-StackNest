import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '../hooks/useAuth'
import { AuthLoading } from './AuthLoading'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Garde de route : n'affiche le contenu que pour un utilisateur authentifié.
 *
 * Tant que la reconnexion silencieuse au boot n'est pas terminée
 * (`isInitializing`), on affiche un écran d'attente plutôt que de rediriger —
 * sinon un rafraîchissement de page éjecterait l'utilisateur connecté vers /login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
