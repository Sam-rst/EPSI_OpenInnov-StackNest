import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { authApi } from '../services/auth.api'
import { useAuth } from './useAuth'

/**
 * Mutation de déconnexion : demande au backend de révoquer le refresh
 * (bump token_version + clear cookie), puis purge l'état local. La purge locale
 * est garantie via `onSettled` même si l'appel réseau échoue.
 */
export function useLogout(): UseMutationResult<void, Error, void> {
  const { clearSession } = useAuth()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSession()
    },
  })
}
