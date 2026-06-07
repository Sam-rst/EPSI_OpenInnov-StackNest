import { z } from 'zod'

import { TemplateCategory } from '../../types/enums/TemplateCategory'

const CATEGORY_VALUES = Object.values(TemplateCategory) as [string, ...string[]]

/** Slug technique : minuscules, chiffres et tirets (ex. « postgresql-16 »). */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Schéma de validation du formulaire admin de template (création / édition).
 * Les `tags` sont saisis en texte séparé par des virgules puis normalisés.
 */
export const templateFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'Le slug doit comporter au moins 2 caractères.')
    .regex(SLUG_PATTERN, 'Slug invalide (minuscules, chiffres et tirets uniquement).'),
  name: z.string().trim().min(2, 'Le nom doit comporter au moins 2 caractères.'),
  icon: z.string().trim().min(1, 'Une icône est requise.'),
  category: z.enum(CATEGORY_VALUES, { message: 'Catégorie invalide.' }),
  provider: z.string().trim().min(2, 'Le provider est requis.'),
  description: z.string().trim().min(10, 'La description doit comporter au moins 10 caractères.'),
  tags: z.string().trim().default(''),
  popular: z.boolean().default(false),
})

export type TemplateFormValues = z.input<typeof templateFormSchema>
export type TemplateFormParsed = z.output<typeof templateFormSchema>

/** Normalise un champ tags « a, b ,c » en tableau `['a','b','c']` sans doublons vides. */
export function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}
