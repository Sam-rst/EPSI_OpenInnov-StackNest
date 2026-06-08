/**
 * Prépare les paramètres d'un déploiement pour l'affichage utilisateur (carte
 * Détails). Deux garde-fous de sécurité/UX :
 *  - #14 : on retire les clés internes (référence conteneur, identifiants
 *    techniques) qui n'ont aucun sens pour l'utilisateur et fuitent l'implémentation.
 *  - #17 : on masque la valeur de tout paramètre dont la clé évoque un secret
 *    (mot de passe, token…), même si l'API la renvoie en clair — défense en
 *    profondeur côté affichage.
 */

/** Masque affiché à la place d'une valeur secrète (jamais le clair). */
export const MASKED_VALUE = '••••••••'

/** Clés internes à ne jamais exposer dans la liste des paramètres (#14). */
const INTERNAL_KEYS: ReadonlySet<string> = new Set([
  'container_ref',
  'container_id',
  'internal_id',
  'image_ref',
  'volume_ref',
])

/** Fragments de clé trahissant un secret : la valeur est masquée à l'affichage (#17). */
const SECRET_KEY_FRAGMENTS: readonly string[] = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'mdp',
]

/** Indique si une clé doit être masquée car elle évoque un secret. */
function isSecretKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return SECRET_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment))
}

/**
 * Renvoie les paires `[clé, valeur]` affichables : clés internes retirées (#14),
 * valeurs secrètes masquées (#17). L'ordre d'insertion est préservé.
 */
export function toDisplayParams(
  params: Readonly<Record<string, string>>,
): readonly (readonly [string, string])[] {
  return Object.entries(params)
    .filter(([key]) => !INTERNAL_KEYS.has(key))
    .map(([key, value]) => [key, isSecretKey(key) ? MASKED_VALUE : value] as const)
}
