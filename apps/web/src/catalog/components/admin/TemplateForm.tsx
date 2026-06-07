import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '../../../shared/components/ui'
import type { TemplateWriteDTO } from '../../types/dto/TemplateWriteDTO'
import { TEMPLATE_CATEGORY_LABELS, TemplateCategory } from '../../types/enums/TemplateCategory'
import { FormField } from './FormField'
import {
  parseTags,
  templateFormSchema,
  type TemplateFormParsed,
  type TemplateFormValues,
} from './templateFormSchema'

interface TemplateFormProps {
  /** Valeurs initiales (mode édition). Vide = création. */
  initialValues?: Partial<TemplateFormValues>
  submitLabel: string
  submitting?: boolean
  onSubmit: (payload: TemplateWriteDTO) => void
  onCancel?: () => void
}

const EMPTY_VALUES: TemplateFormValues = {
  slug: '',
  name: '',
  icon: '',
  category: TemplateCategory.DATABASE,
  provider: '',
  description: '',
  tags: '',
  popular: false,
}

const INPUT_CLASS =
  'border-border bg-surface-elevated text-text-primary focus-visible:outline-cyan h-9 rounded-md border px-3 text-[13px] focus-visible:outline focus-visible:outline-2'

const toPayload = (values: TemplateFormParsed): TemplateWriteDTO => ({
  slug: values.slug,
  name: values.name,
  icon: values.icon,
  category: values.category,
  provider: values.provider,
  description: values.description,
  tags: parseTags(values.tags),
  popular: values.popular,
})

/** Formulaire admin de création / édition d'un template (react-hook-form + zod). */
export function TemplateForm({
  initialValues,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
}: TemplateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateFormValues, unknown, TemplateFormParsed>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: { ...EMPTY_VALUES, ...initialValues },
  })

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toPayload(values)))}
      className="border-border bg-surface-elevated flex flex-col gap-4 rounded-lg border p-5"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="tpl-slug" label="Slug" error={errors.slug?.message}>
          <input id="tpl-slug" className={INPUT_CLASS} {...register('slug')} />
        </FormField>
        <FormField id="tpl-name" label="Nom" error={errors.name?.message}>
          <input id="tpl-name" className={INPUT_CLASS} {...register('name')} />
        </FormField>
        <FormField id="tpl-icon" label="Icône (lucide)" error={errors.icon?.message}>
          <input id="tpl-icon" className={INPUT_CLASS} {...register('icon')} />
        </FormField>
        <FormField id="tpl-provider" label="Provider" error={errors.provider?.message}>
          <input id="tpl-provider" className={INPUT_CLASS} {...register('provider')} />
        </FormField>
        <FormField id="tpl-category" label="Catégorie" error={errors.category?.message}>
          <select id="tpl-category" className={INPUT_CLASS} {...register('category')}>
            {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="tpl-tags"
          label="Tags (séparés par des virgules)"
          error={errors.tags?.message}
        >
          <input id="tpl-tags" className={INPUT_CLASS} {...register('tags')} />
        </FormField>
      </div>

      <FormField id="tpl-description" label="Description" error={errors.description?.message}>
        <textarea
          id="tpl-description"
          rows={3}
          className={`${INPUT_CLASS} h-auto py-2`}
          {...register('description')}
        />
      </FormField>

      <label className="text-text-secondary flex items-center gap-2 text-[13px]">
        <input type="checkbox" {...register('popular')} />
        Mettre en avant (Populaire)
      </label>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="cyan" disabled={submitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  )
}
