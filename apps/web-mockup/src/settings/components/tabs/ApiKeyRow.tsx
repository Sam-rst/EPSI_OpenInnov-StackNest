import { Icon } from '@core/ui';
import type { ApiKey } from '../../data/apiKeys';

interface ApiKeyRowProps {
  apiKey: ApiKey;
}

export function ApiKeyRow({ apiKey }: ApiKeyRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-t border-hairline">
      <Icon name="key" size={14} className="text-sun" />
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-text-primary">{apiKey.name}</div>
        <div className="text-[11px] font-mono text-text-muted">
          {apiKey.token} · créé {apiKey.created} · utilisé {apiKey.last}
        </div>
      </div>
      <button
        type="button"
        className="w-7 h-7 rounded inline-flex items-center justify-center hover:bg-surface-sunken text-text-muted"
      >
        <Icon name="copy" size={13} />
      </button>
      <button type="button" className="text-[12px] font-medium text-danger">Révoquer</button>
    </div>
  );
}
