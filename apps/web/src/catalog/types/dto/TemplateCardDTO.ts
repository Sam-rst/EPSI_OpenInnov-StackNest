/**
 * Miroir exact de la réponse `GET /catalog/templates` (carte légère).
 * Contrat figé : `{id, slug, name, icon, category, provider, tags[], description, popular}`.
 */
export interface TemplateCardDTO {
  id: string
  slug: string
  name: string
  /** Slug d'icône lucide (ex. « database »). */
  icon: string
  /** Valeur brute de l'enum `template_category` (ex. « database »). */
  category: string
  provider: string
  tags: string[]
  description: string
  popular: boolean
}
