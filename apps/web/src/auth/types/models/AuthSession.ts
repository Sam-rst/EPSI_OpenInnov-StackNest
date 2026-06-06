import type { AuthUser } from './AuthUser'

/**
 * Résultat d'un login réussi côté UI : access token (stocké en mémoire) +
 * utilisateur enrichi. Produit par le mapper depuis `AuthResponseDto`.
 */
export interface AuthSession {
  accessToken: string
  user: AuthUser
}
