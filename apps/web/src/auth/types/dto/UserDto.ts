/**
 * Miroir exact du payload utilisateur renvoyé par l'API (`GET /auth/me`,
 * champ `user` de `POST /auth/login`). Aucune transformation : ce DTO reflète
 * la forme brute du backend. La conversion vers le modèle UI passe par un mapper.
 */
export interface UserDto {
  id: string
  email: string
  role: string
  is_verified: boolean
}
