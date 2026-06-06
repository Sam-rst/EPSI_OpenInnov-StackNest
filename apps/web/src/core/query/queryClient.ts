import { QueryClient } from '@tanstack/react-query'

/** Durée pendant laquelle une donnée est considérée fraîche (60 s). */
const DEFAULT_STALE_TIME_MS = 60_000

/** Nombre de tentatives supplémentaires en cas d'échec réseau. */
const DEFAULT_RETRY_COUNT = 1

/**
 * Fabrique un QueryClient avec une configuration raisonnable et partagée :
 * pas de refetch agressif au focus, une seule nouvelle tentative en cas
 * d'erreur, et un staleTime court qui limite les requêtes redondantes.
 * Exposée comme factory pour permettre aux tests d'obtenir une instance isolée.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: DEFAULT_RETRY_COUNT,
        refetchOnWindowFocus: false,
      },
    },
  })
}

/** Instance singleton consommée par le QueryClientProvider applicatif. */
export const queryClient = createQueryClient()
