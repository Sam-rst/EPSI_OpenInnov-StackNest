/**
 * Validation du nom d'un déploiement comme label DNS (RFC 1123) : c'est ce nom
 * qui sert à dériver le nom du conteneur côté worker. On refuse donc tout ce qui
 * n'est pas un label DNS valide (minuscules, chiffres, tirets internes) AVANT
 * l'appel API — l'unicité, elle, est tranchée par le back (cf. erreur 409).
 */

/** Longueur maximale d'un label DNS (RFC 1123). */
const MAX_LABEL_LENGTH = 63

/** Label DNS : minuscules/chiffres, tirets internes, ni début ni fin par tiret. */
const DNS_LABEL_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

/**
 * Valide un nom de déploiement et renvoie un message d'erreur français, ou
 * `undefined` si le nom est un label DNS valide. Message inline pour l'UI.
 */
export function validateDeploymentName(name: string): string | undefined {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return 'Le nom est requis.'
  }
  if (trimmed.length > MAX_LABEL_LENGTH) {
    return `Le nom ne peut pas dépasser ${MAX_LABEL_LENGTH} caractères.`
  }
  if (!DNS_LABEL_PATTERN.test(trimmed)) {
    return 'Minuscules, chiffres et tirets uniquement (pas d’espace ni de tiret en début/fin).'
  }
  return undefined
}
