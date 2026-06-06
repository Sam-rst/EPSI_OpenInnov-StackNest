import { Button } from '../../../shared/components/ui'
import type { ChatPlanMessage } from '../../domain/models/ChatMessage'
import { PlanItemRow } from './PlanItemRow'

interface PlanBubbleProps {
  message: ChatPlanMessage
}

/** Bulle « plan » : ressources proposées, coût estimé et actions (display-only). */
export function PlanBubble({ message }: PlanBubbleProps) {
  return (
    <>
      <div className="space-y-2">
        {message.items.map((item) => (
          <PlanItemRow key={item.name} item={item} />
        ))}
      </div>
      <div className="border-border mt-3 flex items-center justify-between border-t pt-3 text-[12px]">
        <span className="text-text-muted">Coût estimé · Temps</span>
        <span>
          <span className="text-cyan font-mono font-semibold">{message.monthlyCost} €/mois</span> ·{' '}
          <span className="text-text-secondary font-mono">{message.estimatedTime}</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" size="sm" icon="rocket">
          Déployer maintenant
        </Button>
        <Button variant="ghost" size="sm">
          Modifier
        </Button>
      </div>
    </>
  )
}
