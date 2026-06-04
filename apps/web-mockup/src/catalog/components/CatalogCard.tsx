import { Badge, Icon } from '@core/ui';
import type { CatalogItem } from '../domain/models/CatalogItem';

interface CatalogCardProps {
  item: CatalogItem;
  onSelect: (item: CatalogItem) => void;
}

const cardClass =
  'w-full text-left rounded-lg border border-border bg-surface-elevated p-5 group transition hover:border-cyan hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(13,146,151,0.4)]';

export function CatalogCard({ item, onSelect }: CatalogCardProps) {
  return (
    <button type="button" onClick={() => onSelect(item)} className={cardClass}>
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-md flex items-center justify-center shrink-0 bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan">
          <Icon name={item.icon} size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[14.5px] font-semibold text-text-primary">{item.name}</div>
            {item.popular && <Badge tone="yellow">Populaire</Badge>}
          </div>
          <div className="text-[11.5px] mt-0.5 text-text-muted">
            {item.category} · via {item.provider}
          </div>
        </div>
        <Icon
          name="arrow-up-right"
          size={14}
          className="opacity-0 group-hover:opacity-100 transition text-cyan"
        />
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">{item.desc}</p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.tags.map((tag) => (
            <Badge key={tag} tone="neutral">{tag}</Badge>
          ))}
        </div>
        <span className="text-[12px] font-medium text-cyan">Configurer →</span>
      </div>
    </button>
  );
}
