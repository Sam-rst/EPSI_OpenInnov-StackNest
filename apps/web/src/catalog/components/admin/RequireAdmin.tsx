import type { ReactNode } from 'react'

import { EmptyState } from '../../../shared/components/EmptyState'
import { useIsAdmin } from '../../hooks/useIsAdmin'

interface RequireAdminProps {
  children: ReactNode
}

/**
 * Garde d'accès réservée aux administrateurs (écran d'admin du catalogue).
 *
 * Garde minimale locale en attendant que le track auth expose le rôle (voir
 * `useIsAdmin`). Affiche un refus honnête plutôt qu'une page blanche.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const isAdmin = useIsAdmin()

  if (!isAdmin) {
    return (
      <div className="p-8">
        <EmptyState
          icon="shield-alert"
          title="Accès réservé aux administrateurs"
          description="Cette section permet de gérer le catalogue de templates. Demande l'accès administrateur à ton équipe plateforme."
        />
      </div>
    )
  }

  return <>{children}</>
}
