import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore'

/** Marque une config de requête déjà rejouée après refresh (évite la boucle infinie). */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _authRetried?: boolean
  /** Marque l'appel interne `/auth/refresh` : son échec ne déclenche pas `onAuthFailure`. */
  _isRefreshCall?: boolean
}

interface AuthInterceptorOptions {
  /** Appelé quand le refresh échoue : purge effectuée, à charge de rediriger vers /login. */
  onAuthFailure: () => void
}

/**
 * Un 401 sur `/auth/login` est une erreur métier (identifiants invalides), pas une
 * session expirée : on le propage tel quel, sans refresh ni purge de session.
 */
const PUBLIC_AUTH_PATHS = ['/auth/login']

/** Code HTTP signalant un access token absent/expiré. */
const UNAUTHORIZED = 401

function buildRefreshUrl(client: AxiosInstance): string {
  const baseUrl = client.defaults.baseURL ?? ''
  return `${baseUrl}/auth/refresh`
}

function isUnauthorized(status: number | undefined): boolean {
  return status === UNAUTHORIZED
}

function isPublicAuthPath(url: string | undefined): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => (url ?? '').includes(path))
}

function isRefreshPath(url: string | undefined): boolean {
  return (url ?? '').includes('/auth/refresh')
}

/**
 * Branche sur une instance axios la gestion de session côté client :
 * - requête : attache `Authorization: Bearer <access>` depuis le tokenStore ;
 * - réponse 401 : tente `POST /auth/refresh` **une seule fois** (cookie httpOnly),
 *   mémorise le nouvel access token et rejoue la requête d'origine ;
 * - échec du refresh (ou second 401) : purge le token et notifie `onAuthFailure`.
 *
 * `/auth/refresh` et `/auth/login` sont exclus du refresh pour éviter les boucles.
 */
export function attachAuthInterceptor(
  client: AxiosInstance,
  { onAuthFailure }: AuthInterceptorOptions,
): void {
  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
      const config = extractConfig(error)
      const status = extractStatus(error)

      if (!config || !isUnauthorized(status)) {
        return Promise.reject(error)
      }

      // L'échec de l'appel interne /auth/refresh est traité par le bloc try/catch
      // appelant : on le propage sans déclencher deux fois onAuthFailure.
      if (config._isRefreshCall) {
        return Promise.reject(error)
      }

      // 401 sur login = identifiants invalides : erreur métier propagée telle quelle.
      if (isPublicAuthPath(config.url)) {
        return Promise.reject(error)
      }

      // Déjà rejouée, ou refresh lui-même expiré : session morte → purge + redirection.
      if (config._authRetried || isRefreshPath(config.url)) {
        return handleAuthFailure(error, onAuthFailure)
      }

      try {
        await refreshAccessToken(client)
      } catch {
        return handleAuthFailure(error, onAuthFailure)
      }

      config._authRetried = true
      return client.request(config)
    },
  )
}

async function refreshAccessToken(client: AxiosInstance): Promise<void> {
  const { data } = await client.post<{ access_token: string }>(buildRefreshUrl(client), undefined, {
    _isRefreshCall: true,
  } as RetriableConfig)
  setAccessToken(data.access_token)
}

/**
 * Purge la session et déclenche `onAuthFailure` (redirection) **uniquement** si un
 * access token était présent : c'est une vraie expiration de session en cours
 * d'usage. Une sonde de reconnexion à froid (boot sans token) échoue silencieusement
 * — on ne renvoie pas vers /login un visiteur simplement non connecté sur une page
 * publique (landing).
 */
function handleAuthFailure(error: unknown, onAuthFailure: () => void): Promise<never> {
  const hadSession = getAccessToken() !== null
  clearAccessToken()
  if (hadSession) {
    onAuthFailure()
  }
  return Promise.reject(error)
}

function extractConfig(error: unknown): RetriableConfig | undefined {
  if (typeof error === 'object' && error !== null && 'config' in error) {
    return (error as { config?: RetriableConfig }).config
  }
  return undefined
}

function extractStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { status?: number } }).response?.status
  }
  return undefined
}
