import { createApiClient } from './axios-instance'
import { attachAuthInterceptor } from './authInterceptor'

/**
 * Redirige vers la page de connexion quand la session est définitivement perdue
 * (refresh échoué). On force un changement d'URL plutôt que d'utiliser le router
 * pour rester découplé : l'intercepteur vit hors de l'arbre React.
 */
function redirectToLogin(): void {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

/**
 * Instance axios partagée par toute l'application.
 *
 * baseURL pointe vers l'API backend (VITE_API_URL) et withCredentials active
 * l'envoi du cookie de refresh httpOnly. L'intercepteur d'authentification
 * (track auth) attache le Bearer depuis le tokenStore et gère le refresh sur 401.
 */
export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

attachAuthInterceptor(apiClient, { onAuthFailure: redirectToLogin })
