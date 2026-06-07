import { useState } from 'react'

import { Icon } from '../../shared/components/ui'
import { TemplateAdminRow } from '../components/admin/TemplateAdminRow'
import { TemplateForm } from '../components/admin/TemplateForm'
import type { TemplateFormValues } from '../components/admin/templateFormSchema'
import type { CatalogItem } from '../domain/models/CatalogItem'
import { useCatalogTemplates } from '../hooks/useCatalogTemplates'
import { useTemplateMutations } from '../hooks/useTemplateMutations'
import { getTemplate } from '../services/templateService'
import type { TemplateWriteDTO } from '../types/dto/TemplateWriteDTO'

interface EditState {
  id: string
  values: TemplateFormValues
}

const toFormValues = (payload: TemplateWriteDTO): TemplateFormValues => ({
  slug: payload.slug,
  name: payload.name,
  icon: payload.icon,
  category: payload.category,
  provider: payload.provider,
  description: payload.description,
  tags: payload.tags.join(', '),
  popular: payload.popular,
})

/** Contenu de l'écran admin (liste + formulaire), supposé déjà gardé par RequireAdmin. */
export function CatalogAdminContent() {
  const { items, loading } = useCatalogTemplates()
  const { create, update, remove } = useTemplateMutations()
  const [editing, setEditing] = useState<EditState | null>(null)

  const handleEdit = async (item: CatalogItem): Promise<void> => {
    const detail = await getTemplate(item.id)
    setEditing({
      id: detail.id,
      values: toFormValues({
        slug: detail.slug,
        name: detail.name,
        icon: detail.icon,
        category: detail.category,
        provider: detail.provider,
        description: detail.description,
        tags: [...detail.tags],
        popular: detail.popular,
      }),
    })
  }

  const handleCreate = (payload: TemplateWriteDTO): void => {
    create.mutate(payload)
  }

  const handleUpdate = (payload: TemplateWriteDTO): void => {
    if (!editing) {
      return
    }
    update.mutate({ id: editing.id, payload }, { onSuccess: () => setEditing(null) })
  }

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-text-primary text-[28px] font-bold tracking-[-0.02em]">
          Administration du catalogue
        </h1>
        <p className="text-text-secondary mt-1 text-[13.5px]">
          Créer, éditer et supprimer les templates proposés aux équipes.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(360px,420px)]">
        <section>
          <h2 className="text-text-primary mb-3 text-[15px] font-semibold">
            Templates ({items.length})
          </h2>
          {loading ? (
            <p className="text-text-muted text-[13px]">Chargement…</p>
          ) : (
            <ul className="border-border bg-surface-elevated overflow-hidden rounded-lg border">
              {items.map((item) => (
                <TemplateAdminRow
                  key={item.id}
                  item={item}
                  onEdit={(target) => void handleEdit(target)}
                  onDelete={(target) => remove.mutate(target.id)}
                  deleting={remove.isPending}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-text-primary mb-3 flex items-center gap-2 text-[15px] font-semibold">
            <Icon name={editing ? 'pencil' : 'plus'} size={16} />
            {editing ? `Éditer « ${editing.values.name} »` : 'Nouveau template'}
          </h2>
          {editing ? (
            <TemplateForm
              key={editing.id}
              initialValues={editing.values}
              submitLabel="Enregistrer les modifications"
              submitting={update.isPending}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <TemplateForm
              submitLabel="Créer le template"
              submitting={create.isPending}
              onSubmit={handleCreate}
            />
          )}
        </section>
      </div>
    </div>
  )
}
