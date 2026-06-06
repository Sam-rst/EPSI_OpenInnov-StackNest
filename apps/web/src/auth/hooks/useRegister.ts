import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { authApi } from '../services/auth.api'
import type { CredentialsRequestDto } from '../types/dto/AuthRequestDto'

/**
 * Mutation d'inscription : poste email + mot de passe. La réponse backend est
 * générique (202, anti-énumération) : on n'authentifie pas, on invite juste
 * l'utilisateur à confirmer son adresse e-mail.
 */
export function useRegister(): UseMutationResult<void, Error, CredentialsRequestDto> {
  return useMutation({
    mutationFn: (credentials: CredentialsRequestDto) => authApi.register(credentials),
  })
}
