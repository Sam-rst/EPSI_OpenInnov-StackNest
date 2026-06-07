import { useAuth } from '../../auth/hooks/useAuth'

/**
 * Indique si l'utilisateur courant a le rôle administrateur.
 *
 * Dérive le drapeau du contexte d'authentification réel (`user.isAdmin`, miroir
 * du rôle backend). Renvoie `false` hors session (`user` à `null`), ce qui
 * réserve les écrans d'administration aux comptes admin authentifiés.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return user?.isAdmin === true
}
