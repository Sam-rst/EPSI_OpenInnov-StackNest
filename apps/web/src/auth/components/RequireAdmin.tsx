import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '../hooks/useAuth'
import { AuthLoading } from './AuthLoading'

interface RequireAdminProps {
  children: ReactNode
}

/**
 * Garde de route RBAC : réserve le contenu aux administrateurs.
 *
 * Un visiteur non authentifié est renvoyé vers /login ; un utilisateur connecté
 * mais sans le rôle admin est renvoyé vers le tableau de bord (pas d'accès, mais
 * pas non plus de fuite vers la page de connexion).
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { isAuthenticated, isInitializing, user } = useAuth()

  if (isInitializing) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
