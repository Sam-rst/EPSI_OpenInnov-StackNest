import { Button } from '@core/ui';
import { PlanItemRow } from './PlanItemRow';
import type { PlanMessage } from '../../domain/models/Message';

interface PlanBubbleProps {
  message: PlanMessage;
}

export function PlanBubble({ message }: PlanBubbleProps) {
  return (
    <>
      <div className="space-y-2">
        {message.items.map((item) => (
          <PlanItemRow key={item.name} item={item} />
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[12px]">
        <span className="text-text-muted">Coût estimé · Temps</span>
        <span>
          <span className="font-mono font-semibold text-cyan">{message.cost} €/mois</span>{' '}
          · <span className="font-mono text-text-secondary">{message.time}</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" size="sm" icon="rocket">Déployer maintenant</Button>
        <Button variant="ghost" size="sm">Modifier</Button>
      </div>
    </>
  );
}
