import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './theme/ThemeProvider'
import { EnvironmentBanner } from './components/EnvironmentBanner'
import { AuthProvider } from '../auth/providers/AuthProvider'
import { queryClient } from './query/queryClient'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Compose les providers globaux de l'application dans l'ordre attendu :
 * ErrorBoundary (capture tout) → QueryClientProvider (cache serveur partagé,
 * placé haut pour couvrir auth et router) → ThemeProvider → AuthProvider.
 * Le bandeau d'environnement reste rendu hors du flux des routes.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div className="flex h-dvh flex-col overflow-hidden">
            <EnvironmentBanner environment={import.meta.env.VITE_ENVIRONMENT} />
            <AuthProvider>{children}</AuthProvider>
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
