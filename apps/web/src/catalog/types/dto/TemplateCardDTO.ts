/**
 * Miroir exact de la réponse `GET /catalog/templates` (carte légère).
 * Contrat figé : `{id, slug, name, icon, category, provider, engine, tags[], description, popular}`.
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
  /** Valeur brute de l'enum `engine_kind` (« docker » | « terraform »). */
  engine: string
  tags: string[]
  description: string
  popular: boolean
}
