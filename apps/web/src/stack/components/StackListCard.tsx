import { useNavigate } from 'react-router-dom'

import { Badge, Checkbox, Icon } from '../../shared/components/ui'
import { toneForStackStatus } from '../types/enums/StackStatus'
import type { StackSummary } from '../types/models/Stack'

interface StackListCardProps {
  stack: StackSummary
  selected: boolean
  onToggleSelect: (id: string) => void
}

/**
 * Carte d'une stack pour la liste responsive mobile (< md). Porte une case à
 * cocher de sélection (actions groupées) et une zone cliquable vers le détail.
 * La case et le bouton sont des éléments distincts (une case ne peut pas vivre
 * dans un `<button>`), gardant l'HTML et l'accessibilité valides.
 */
export function StackListCard({ stack, selected, onToggleSelect }: StackListCardProps) {
  const navigate = useNavigate()
  const serviceLabel = stack.serviceCount > 1 ? 'services' : 'service'

  return (
    <div className="border-border bg-surface-elevated flex items-start gap-3 rounded-lg border p-4">
      <Checkbox
        checked={selected}
        onChange={() => onToggleSelect(stack.id)}
        aria-label={`Sélectionner la stack ${stack.name}`}
        className="mt-1"
      />
      <button
        type="button"
        onClick={() => navigate(`/stacks/${stack.id}`)}
        aria-label={`Voir la stack ${stack.name}`}
        className="group min-w-0 flex-1 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="text-cyan flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
              <Icon name="layers" size={18} />
            </span>
            <div className="min-w-0">
              <div className="text-text-primary truncate text-[14px] font-semibold">
                {stack.name}
              </div>
              <div className="text-text-muted text-[12px]">
                {stack.serviceCount} {serviceLabel}
              </div>
            </div>
          </div>
          <Badge tone={toneForStackStatus(stack.status)}>{stack.statusLabel}</Badge>
        </div>
      </button>
    </div>
  )
}
