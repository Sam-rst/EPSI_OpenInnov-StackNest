/** Ressource provisionnable affichée dans le catalogue. */
export interface CatalogItem {
  id: string
  name: string
  /** Nom d'icône lucide kebab-case (ex. « database »). */
  icon: string
  category: string
  provider: string
  tags: readonly string[]
  description: string
  popular?: boolean
}
