/**
 * Store en mémoire de l'access token JWT.
 *
 * Volontairement non persisté (ni localStorage ni cookie) : l'access token vit
 * uniquement dans la mémoire de l'onglet pour limiter la surface XSS. Le refresh
 * token, lui, transite par un cookie httpOnly côté backend. L'intercepteur de
 * refresh (livré dans le track auth) lira et écrira ici via ces accesseurs.
 */
let accessToken: string | null = null

/** Retourne l'access token courant, ou null si aucun n'est défini. */
export function getAccessToken(): string | null {
  return accessToken
}

/** Mémorise l'access token (remplace le précédent). */
export function setAccessToken(token: string): void {
  accessToken = token
}

/** Efface l'access token courant (déconnexion / refresh échoué). */
export function clearAccessToken(): void {
  accessToken = null
}
