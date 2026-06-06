/**
 * Payload des endpoints admin `POST`/`PUT /catalog/templates[/{id}]`.
 *
 * Périmètre PR Cat-2 : champs de carte (sans `id`). Les versions et paramètres
 * sont gérés ultérieurement (hors périmètre de l'écran admin initial).
 */
export interface TemplateWriteDTO {
  slug: string
  name: string
  icon: string
  /** Valeur brute de l'enum `template_category` (ex. « database »). */
  category: string
  provider: string
  description: string
  tags: string[]
  popular: boolean
}
