import type { UserDto } from './UserDto'

/**
 * Miroir de la réponse de `POST /auth/login` :
 * `{ access_token, user }`. Le cookie refresh httpOnly est géré par le navigateur.
 */
export interface AuthResponseDto {
  access_token: string
  user: UserDto
}

/**
 * Miroir de la réponse de `POST /auth/refresh` : seul un nouvel access token est
 * renvoyé (l'utilisateur n'est pas re-sérialisé), le cookie refresh est renouvelé.
 */
export interface RefreshResponseDto {
  access_token: string
}
