/**
 * Rôles applicatifs (RBAC). Miroir de l'enum `user_role` côté backend.
 * `user` : compte standard. `admin` : accès aux écrans d'administration.
 */
export const USER_ROLES = ['user', 'admin'] as const

export type UserRole = (typeof USER_ROLES)[number]

/** Garde de type : vrai si la valeur est un rôle connu. */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)
}
