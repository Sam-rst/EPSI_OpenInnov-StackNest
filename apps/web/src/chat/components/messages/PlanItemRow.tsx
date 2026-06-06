import { Icon } from '../../../shared/components/ui'
import type { ChatPlanItem } from '../../domain/models/ChatMessage'

interface PlanItemRowProps {
  item: ChatPlanItem
}

/** Ligne d'une ressource proposée dans un plan de provisionnement. */
export function PlanItemRow({ item }: PlanItemRowProps) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-md border p-2.5">
      <span className="text-cyan flex h-8 w-8 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
        <Icon name={item.icon} size={14} />
      </span>
      <div className="flex-1">
        <div className="text-text-primary text-[12.5px] font-semibold">{item.name}</div>
        <div className="text-text-muted font-mono text-[11px]">{item.spec}</div>
      </div>
      <Icon name="check-circle-2" size={14} className="text-success" />
    </div>
  )
}
