/**
 * Miroir exact de la réponse `GET /catalog/templates` (carte légère).
 * Contrat figé : `{id, slug, name, icon, category, provider, engine, tags[],
 * description, popular, is_deployable}`.
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
  /**
   * Faux pour un template visible mais non déployable (runtime langage : carte
   * « Bientôt disponible »). Optionnel : une API antérieure peut l'omettre — le
   * mapper retombe alors sur `true` (carte déployable par défaut).
   */
  is_deployable?: boolean
}
