/**
 * Catégories de templates — miroir de l'enum Postgres `template_category`
 * et de `app/catalog/domain/enums/template_category.py` côté API.
 *
 * Les valeurs (lowercase) sont celles renvoyées par l'API ; les libellés
 * français lisibles sont fournis par `TEMPLATE_CATEGORY_LABELS`.
 */
export const TemplateCategory = {
  DATABASE: 'database',
  CACHE: 'cache',
  RUNTIME: 'runtime',
  STORAGE: 'storage',
  VM: 'vm',
  NETWORK: 'network',
  OBSERVABILITY: 'observability',
  SECURITY: 'security',
  AI: 'ai',
} as const

export type TemplateCategory = (typeof TemplateCategory)[keyof typeof TemplateCategory]

/** Libellés français affichés dans l'UI pour chaque catégorie. */
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  database: 'Base de données',
  cache: 'Cache',
  runtime: 'Runtime',
  storage: 'Stockage',
  vm: 'Machine virtuelle',
  network: 'Réseau',
  observability: 'Observabilité',
  security: 'Sécurité',
  ai: 'IA',
}

/** Renvoie le libellé français d'une catégorie (ou la valeur brute si inconnue). */
export function labelForCategory(category: string): string {
  return TEMPLATE_CATEGORY_LABELS[category as TemplateCategory] ?? category
}
