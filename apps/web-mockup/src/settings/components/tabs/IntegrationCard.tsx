import { Badge, Button, Icon } from '@core/ui';
import type { Integration } from '../../data/integrations';

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-md border border-border">
      <span className="w-10 h-10 rounded-md flex items-center justify-center bg-surface-sunken text-text-secondary">
        <Icon name={integration.icon} size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-text-primary">{integration.name}</div>
        <div className="text-[11px] text-text-muted">{integration.desc}</div>
      </div>
      {integration.status === 'connected' ? (
        <Badge tone="success">Connecté</Badge>
      ) : (
        <Button size="sm" variant="secondary">Connecter</Button>
      )}
    </div>
  );
}
