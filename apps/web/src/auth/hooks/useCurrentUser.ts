import { CURRENT_USER_FIXTURE } from '../data/currentUser.fixtures'
import type { CurrentUser } from '../domain/models/CurrentUser'

/**
 * Fournit l'utilisateur courant consommé par le shell (TopBar).
 *
 * Vague 1 (rendu) : renvoie une fixture (utilisateur de démo « John Doe »).
 * Vague 2 (login) : lira l'utilisateur authentifié depuis l'AuthContext / l'API
 *   sans changer la signature — la TopBar reste inchangée.
 */
export function useCurrentUser(): CurrentUser {
  return CURRENT_USER_FIXTURE
}
