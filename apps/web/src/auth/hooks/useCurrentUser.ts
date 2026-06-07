import { CURRENT_USER_FIXTURE } from '../data/currentUser.fixtures'
import type { CurrentUser } from '../domain/models/CurrentUser'
import { useAuth } from './useAuth'

/**
 * Fournit l'utilisateur courant consommé par le shell (TopBar).
 *
 * Connecté : mappe l'utilisateur authentifié de l'AuthContext (email + rôle).
 * Non connecté (boot, pages publiques) : renvoie un utilisateur neutre/anonyme
 * (aucune identité inventée). Signature inchangée — la TopBar reste identique.
 */
export function useCurrentUser(): CurrentUser {
  const { user } = useAuth()
  if (!user) {
    return CURRENT_USER_FIXTURE
  }
  return {
    id: user.id,
    name: user.email,
    role: user.isAdmin ? 'Administrateur' : 'Membre',
  }
}
