import type { TemplateParam } from './TemplateParam'
import type { TemplateVersion } from './TemplateVersion'

/**
 * Fiche détaillée d'un template, enrichie pour l'UI : libellé de catégorie en
 * français (`categoryLabel`) en plus de la valeur brute (`category`), versions
 * et paramètres triés. Consommée par `CatalogDetailPage`.
 */
export interface TemplateDetail {
  id: string
  slug: string
  name: string
  icon: string
  /** Valeur brute de l'enum catégorie (ex. « database »). */
  category: string
  /** Libellé français affichable de la catégorie (ex. « Base de données »). */
  categoryLabel: string
  provider: string
  tags: readonly string[]
  description: string
  popular: boolean
  versions: readonly TemplateVersion[]
  params: readonly TemplateParam[]
}
