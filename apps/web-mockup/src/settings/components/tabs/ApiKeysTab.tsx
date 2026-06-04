import { Button, Card } from '@core/ui';
import { API_KEYS } from '../../data/apiKeys';
import { ApiKeyRow } from './ApiKeyRow';

export function ApiKeysTab() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary">Clés API</h2>
          <p className="text-[12.5px] text-text-muted">Pour automatiser le déploiement via CI/CD.</p>
        </div>
        <Button variant="primary" icon="plus" size="sm">Nouvelle clé</Button>
      </div>
      {API_KEYS.map((apiKey) => (
        <ApiKeyRow key={apiKey.name} apiKey={apiKey} />
      ))}
    </Card>
  );
}
