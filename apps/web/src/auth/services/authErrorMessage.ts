import { isAxiosError } from 'axios'

/** Messages d'erreur utilisateur (français) selon le code HTTP renvoyé par l'API. */
const MESSAGE_BY_STATUS: Record<number, string> = {
  401: 'Identifiants invalides.',
  403: "Votre adresse e-mail n'est pas encore vérifiée.",
  429: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
}

const GENERIC_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.'

/**
 * Traduit une erreur de requête (axios) en message utilisateur français.
 * Volontairement générique : on n'expose pas le détail technique du backend.
 */
export function authErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response) {
    return MESSAGE_BY_STATUS[error.response.status] ?? GENERIC_MESSAGE
  }
  return GENERIC_MESSAGE
}
