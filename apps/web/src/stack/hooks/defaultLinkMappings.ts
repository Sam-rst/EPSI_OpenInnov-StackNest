import type { TemplateConfig } from '../../deployment/types/models/TemplateConfig'

/**
 * Expressions de résolution worker-side (cf. design § Provisioning) :
 *   - `{to.alias}`  → nom de service compose (DNS interne du fournisseur)
 *   - `{to.port}`   → port interne du fournisseur
 *   - `{to.secret}` → secret généré du fournisseur (jamais exposé au REST/SSE)
 *   - `{to.db_name}`→ nom de base, repris du param `db_name` du fournisseur
 */
const EXPR_ALIAS = '{to.alias}'
const EXPR_PORT = '{to.port}'
const EXPR_SECRET = '{to.secret}'
const EXPR_DB_NAME = '{to.db_name}'

/** Clé de paramètre conventionnelle portant le nom de base d'un fournisseur. */
const DB_NAME_PARAM_KEY = 'db_name'

/**
 * Propose des `var_mappings` par défaut pour un lien, dérivés du descripteur du
 * service **fournisseur** (cf. design § Builder/Liens). L'idée : réduire la
 * friction en pré-remplissant les variables d'environnement usuelles que le
 * consommateur attend, l'utilisateur ajustant ensuite.
 *
 * Toujours au moins `DB_HOST` (fallback DNS : l'alias reste résolvable même sans
 * mapping). On ajoute `DB_PORT` si le fournisseur expose un port interne,
 * `DB_PASSWORD` (+ une URL assemblée) s'il déclare un secret, et `DB_NAME` s'il
 * porte un paramètre `db_name`. Les expressions sont résolues côté worker — ce
 * ne sont jamais des valeurs en clair (le secret réel n'apparaît pas ici).
 */
export function defaultLinkMappings(provider: TemplateConfig): Record<string, string> {
  const mappings: Record<string, string> = { DB_HOST: EXPR_ALIAS }

  const hasPort = provider.internalPort !== null
  const hasSecret = provider.secretEnv !== null
  const hasDbName = provider.params.some((param) => param.key === DB_NAME_PARAM_KEY)

  if (hasPort) {
    mappings.DB_PORT = EXPR_PORT
  }
  if (hasSecret) {
    mappings.DB_PASSWORD = EXPR_SECRET
  }
  if (hasDbName) {
    mappings.DB_NAME = EXPR_DB_NAME
  }
  if (hasPort && hasSecret) {
    mappings.DATABASE_URL = buildConnectionUrl(hasDbName)
  }

  return mappings
}

/** Assemble une URL de connexion à partir des expressions worker-side. */
function buildConnectionUrl(hasDbName: boolean): string {
  const database = hasDbName ? `/${EXPR_DB_NAME}` : ''
  return `://${EXPR_SECRET}@${EXPR_ALIAS}:${EXPR_PORT}${database}`
}
