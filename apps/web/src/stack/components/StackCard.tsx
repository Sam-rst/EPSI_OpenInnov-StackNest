import { useNavigate } from 'react-router-dom'

import { Badge, Icon } from '../../shared/components/ui'
import { toneForStackStatus } from '../types/enums/StackStatus'
import type { StackSummary } from '../types/models/Stack'

interface StackCardProps {
  stack: StackSummary
}

/**
 * Carte d'une stack dans la liste : nom, badge de statut global, nombre de
 * services. La carte entière est cliquable vers le détail `/stacks/{id}`.
 */
export function StackCard({ stack }: StackCardProps) {
  const navigate = useNavigate()
  const serviceLabel = stack.serviceCount > 1 ? 'services' : 'service'

  return (
    <button
      type="button"
      onClick={() => navigate(`/stacks/${stack.id}`)}
      className="group border-border bg-surface-elevated hover:border-cyan w-full rounded-lg border p-5 text-left transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-cyan flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
            <Icon name="layers" size={18} />
          </span>
          <div>
            <div className="text-text-primary text-[14px] font-semibold">{stack.name}</div>
            <div className="text-text-muted text-[12px]">
              {stack.serviceCount} {serviceLabel}
            </div>
          </div>
        </div>
        <Badge tone={toneForStackStatus(stack.status)}>{stack.statusLabel}</Badge>
      </div>
    </button>
  )
}
