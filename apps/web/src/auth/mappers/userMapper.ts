import type { UserDto } from '../types/dto/UserDto'
import type { AuthUser } from '../types/models/AuthUser'
import { isUserRole, type UserRole } from '../types/enums/UserRole'

/** Rôle par défaut si le backend renvoie une valeur inattendue (robustesse). */
const FALLBACK_ROLE: UserRole = 'user'

/**
 * Convertit un `UserDto` (forme API, snake_case) en `AuthUser` (modèle UI) :
 * normalise le rôle vers l'enum connu et dérive le drapeau `isAdmin`.
 */
export function toAuthUser(dto: UserDto): AuthUser {
  const role: UserRole = isUserRole(dto.role) ? dto.role : FALLBACK_ROLE

  return {
    id: dto.id,
    email: dto.email,
    role,
    isVerified: dto.is_verified,
    isAdmin: role === 'admin',
  }
}
