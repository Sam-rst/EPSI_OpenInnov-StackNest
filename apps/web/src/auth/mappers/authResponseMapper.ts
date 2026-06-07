import type { AuthResponseDto } from '../types/dto/AuthResponseDto'
import type { AuthSession } from '../types/models/AuthSession'
import { toAuthUser } from './userMapper'

/**
 * Convertit la réponse de login (`AuthResponseDto`) en session UI :
 * conserve l'access token et délègue l'enrichissement de l'utilisateur au mapper.
 */
export function toAuthSession(dto: AuthResponseDto): AuthSession {
  return {
    accessToken: dto.access_token,
    user: toAuthUser(dto.user),
  }
}
