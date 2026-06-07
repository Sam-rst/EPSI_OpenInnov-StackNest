import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

/**
 * Adaptateur minimal entre un schéma Zod et react-hook-form, sans dépendre du
 * paquet `@hookform/resolvers` (non installé). Valide les valeurs avec le schéma
 * et convertit les éventuelles erreurs Zod au format attendu par RHF.
 */
export function zodResolver<TValues extends FieldValues>(
  schema: ZodType<TValues>,
): Resolver<TValues> {
  return (values) => {
    const result = schema.safeParse(values)

    if (result.success) {
      return { values: result.data, errors: {} }
    }

    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !(field in errors)) {
        errors[field] = { type: issue.code, message: issue.message }
      }
    }

    return { values: {}, errors: errors as FieldErrors<TValues> }
  }
}
