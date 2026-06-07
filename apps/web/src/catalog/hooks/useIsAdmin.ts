import { useAuth } from '../../auth/hooks/useAuth'

/**
 * Indique si l'utilisateur courant a le rôle administrateur.
 *
 * TODO(auth) : le socle d'authentification n'expose pour l'instant que
 * `isAuthenticated`. On lit ici un éventuel champ `isAdmin` du contexte (gardé
 * forward-compatible) ; tant que le track auth ne fournit pas le rôle, l'accès
 * admin est refusé par défaut. Remplacer par la vraie source de rôle
 * (`useAuth().user.role === 'admin'`) dès que disponible.
 */
export function useIsAdmin(): boolean {
  const auth = useAuth() as { isAuthenticated: boolean; isAdmin?: boolean }
  return auth.isAuthenticated && auth.isAdmin === true
}
