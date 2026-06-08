import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

import { setAccessToken } from './tokenStore'

/**
 * Marque l'appel interne `POST /auth/refresh` pour que l'intercepteur de réponse
 * ne le traite pas lui-même comme un 401 à rejouer (évite la boucle infinie).
 * Le champ est consommé par `authInterceptor`.
 */
export interface RefreshCallConfig extends InternalAxiosRequestConfig {
  _isRefreshCall: true
}

/** Réponse du back au rafraîchissement : le nouvel access token. */
interface RefreshResponse {
  access_token: string
}

function buildRefreshUrl(client: AxiosInstance): string {
  const baseUrl = client.defaults.baseURL ?? ''
  return `${baseUrl}/auth/refresh`
}

/**
 * Rafraîchit l'access token via `POST /auth/refresh` (cookie de refresh httpOnly)
 * et le mémorise dans le tokenStore. Source de vérité unique du refresh, partagée
 * par l'intercepteur axios (rejeu sur 401) et le flux SSE de déploiement (qui ne
 * passe pas par axios mais doit rafraîchir le Bearer à l'identique).
 *
 * Lève l'erreur axios telle quelle si le refresh échoue (refresh token expiré) :
 * c'est à l'appelant de décider de la conduite (purge de session, état d'erreur).
 */
export async function refreshAccessToken(client: AxiosInstance): Promise<void> {
  const { data } = await client.post<RefreshResponse>(buildRefreshUrl(client), undefined, {
    _isRefreshCall: true,
  } as RefreshCallConfig)
  setAccessToken(data.access_token)
}
