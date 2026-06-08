import { isAxiosError } from 'axios'

/** Message affiché quand l'erreur n'est pas exploitable (corps inattendu, etc.). */
const GENERIC_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.'

/** Message affiché quand la requête n'a même pas obtenu de réponse (réseau). */
const NETWORK_MESSAGE = 'Le serveur est injoignable. Vérifiez votre connexion réseau.'

/** Une entrée de validation FastAPI (`detail: [...]`). */
interface ValidationDetail {
  msg?: unknown
}

/** Extrait le `message` métier d'un corps `{error, message}` (DomainException). */
function fromDomainBody(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message: unknown }).message
    return typeof message === 'string' && message.length > 0 ? message : undefined
  }
  return undefined
}

/** Extrait le `detail` d'une erreur FastAPI : string brute ou liste de validation. */
function fromDetail(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('detail' in data)) {
    return undefined
  }
  const detail = (data as { detail: unknown }).detail
  if (typeof detail === 'string' && detail.length > 0) {
    return detail
  }
  if (Array.isArray(detail)) {
    const messages = (detail as ValidationDetail[])
      .map((entry) => entry.msg)
      .filter((msg): msg is string => typeof msg === 'string')
    return messages.length > 0 ? messages.join(' · ') : undefined
  }
  return undefined
}

/**
 * Traduit une erreur d'appel `/deployments` en message utilisateur français,
 * en privilégiant le message renvoyé par l'API (#1) : le `message` métier d'une
 * `DomainException` (`{error, message}`, ex. 409 nom déjà pris), sinon le
 * `detail` d'une 422 FastAPI (string ou liste de validation), sinon un repli
 * lisible. Sans réponse HTTP, on signale un problème réseau.
 */
export function deploymentErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return GENERIC_MESSAGE
  }
  if (!error.response) {
    return NETWORK_MESSAGE
  }
  return fromDomainBody(error.response.data) ?? fromDetail(error.response.data) ?? GENERIC_MESSAGE
}
