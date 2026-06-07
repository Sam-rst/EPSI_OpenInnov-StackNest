import type { UserRole } from '../enums/UserRole'

/**
 * Utilisateur authentifié enrichi pour l'UI : `role` est typé (enum) et un drapeau
 * dérivé `isAdmin` évite de comparer des chaînes dans les composants.
 */
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  isVerified: boolean
  isAdmin: boolean
}
