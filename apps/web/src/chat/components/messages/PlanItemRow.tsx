import { Icon } from '@core/ui';
import type { PlanItem } from '../../domain/models/Message';

interface PlanItemRowProps {
  item: PlanItem;
}

export function PlanItemRow({ item }: PlanItemRowProps) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-surface">
      <span className="w-8 h-8 rounded-md flex items-center justify-center bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan">
        <Icon name={item.icon} size={14} />
      </span>
      <div className="flex-1">
        <div className="text-[12.5px] font-semibold text-text-primary">{item.name}</div>
        <div className="text-[11px] font-mono text-text-muted">{item.spec}</div>
      </div>
      <Icon name="check-circle-2" size={14} className="text-success" />
    </div>
  );
}
