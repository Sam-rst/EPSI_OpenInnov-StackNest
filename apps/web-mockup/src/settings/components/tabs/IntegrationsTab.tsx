import { Card } from '@core/ui';
import { INTEGRATIONS } from '../../data/integrations';
import { IntegrationCard } from './IntegrationCard';

export function IntegrationsTab() {
  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-semibold mb-1 text-text-primary">Intégrations</h2>
      <p className="text-[12.5px] mb-5 text-text-muted">Connecte tes outils habituels.</p>
      <div className="grid grid-cols-2 gap-3">
        {INTEGRATIONS.map((integration) => (
          <IntegrationCard key={integration.name} integration={integration} />
        ))}
      </div>
    </Card>
  );
}
