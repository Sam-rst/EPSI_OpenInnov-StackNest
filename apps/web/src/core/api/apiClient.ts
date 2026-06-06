import { createApiClient } from './axios-instance'

/**
 * Instance axios partagée par toute l'application.
 *
 * baseURL pointe vers l'API backend (VITE_API_URL) et withCredentials active
 * l'envoi du cookie de refresh httpOnly. L'intercepteur de refresh d'access
 * token sera branché ici par le track auth — ce socle ne fournit que l'instance.
 */
export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL,
  withCredentials: true,
})
