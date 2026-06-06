import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { authApi } from '../services/auth.api'
import type { CredentialsRequestDto } from '../types/dto/AuthRequestDto'
import type { AuthSession } from '../types/models/AuthSession'
import { useAuth } from './useAuth'

/**
 * Mutation de connexion : poste les identifiants, et sur succès hydrate le
 * contexte d'authentification (token en mémoire + utilisateur). Les erreurs
 * (401 identifiants invalides) sont propagées au formulaire appelant.
 */
export function useLogin(): UseMutationResult<AuthSession, Error, CredentialsRequestDto> {
  const { setSession } = useAuth()

  return useMutation({
    mutationFn: (credentials: CredentialsRequestDto) => authApi.login(credentials),
    onSuccess: (session) => {
      setSession(session)
    },
  })
}
