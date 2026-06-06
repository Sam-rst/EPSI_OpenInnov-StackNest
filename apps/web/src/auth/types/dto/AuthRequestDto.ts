/**
 * Corps des requêtes d'authentification (miroir exact des endpoints backend,
 * snake_case identique côté API). Regroupés ici car ce sont des contrats d'API.
 */

/** `POST /auth/register` et `POST /auth/login`. */
export interface CredentialsRequestDto {
  email: string
  password: string
}

/** `POST /auth/forgot`. */
export interface ForgotRequestDto {
  email: string
}

/** `POST /auth/reset`. */
export interface ResetRequestDto {
  token: string
  password: string
}

/** `POST /auth/verify`. */
export interface VerifyRequestDto {
  token: string
}
