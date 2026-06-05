import type { CurrentUser } from '../domain/models/CurrentUser'

/**
 * Utilisateur neutre/anonyme servi tant que le login n'est pas branché (Vague 2).
 * Aucune identité inventée : libellé générique et rôle neutre. Le vrai
 * utilisateur authentifié remplacera ces valeurs sans changer la signature.
 */
export const CURRENT_USER_FIXTURE: CurrentUser = {
  id: 'usr_anonyme',
  name: 'Utilisateur',
  role: 'Session locale',
}
