import { Badge, Icon } from '../../shared/components/ui'
import type { CatalogItem } from '../domain/models/CatalogItem'

interface CatalogCardProps {
  item: CatalogItem
  onSelect: (item: CatalogItem) => void
}

const CARD_CLASS =
  'w-full text-left rounded-lg border border-border bg-surface-elevated p-5 group transition hover:border-cyan hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(13,146,151,0.4)]'

export function CatalogCard({ item, onSelect }: CatalogCardProps) {
  return (
    <button type="button" onClick={() => onSelect(item)} className={CARD_CLASS}>
      <div className="flex items-start gap-3">
        <span className="text-cyan flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
          <Icon name={item.icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="text-text-primary min-w-0 text-[14.5px] font-semibold break-words">
              {item.name}
            </div>
            {item.popular && (
              <Badge tone="yellow" className="shrink-0">
                Populaire
              </Badge>
            )}
          </div>
          <div className="text-text-muted mt-0.5 truncate text-[11.5px]">
            {item.category} · via {item.provider}
          </div>
        </div>
        <Icon
          name="arrow-up-right"
          size={14}
          className="text-cyan shrink-0 opacity-0 transition group-hover:opacity-100"
        />
      </div>
      <p className="text-text-secondary mt-3 text-[13px] leading-relaxed">{item.description}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {item.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
        <span className="text-cyan shrink-0 text-[12px] font-medium whitespace-nowrap">
          Configurer →
        </span>
      </div>
    </button>
  )
}
