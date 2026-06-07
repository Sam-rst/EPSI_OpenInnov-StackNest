import { Button, Icon } from '../../../shared/components/ui'
import type { CatalogItem } from '../../domain/models/CatalogItem'

interface TemplateAdminRowProps {
  item: CatalogItem
  onEdit: (item: CatalogItem) => void
  onDelete: (item: CatalogItem) => void
  deleting?: boolean
}

/** Ligne d'administration d'un template : identité + actions éditer / supprimer. */
export function TemplateAdminRow({
  item,
  onEdit,
  onDelete,
  deleting = false,
}: TemplateAdminRowProps) {
  return (
    <li className="border-border flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <span className="text-cyan flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
        <Icon name={item.icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-text-primary text-[13.5px] font-semibold">{item.name}</div>
        <div className="text-text-muted text-[11.5px]">
          {item.category} · via {item.provider}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon="pencil" onClick={() => onEdit(item)}>
          Éditer
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon="trash-2"
          disabled={deleting}
          onClick={() => onDelete(item)}
        >
          Supprimer
        </Button>
      </div>
    </li>
  )
}
