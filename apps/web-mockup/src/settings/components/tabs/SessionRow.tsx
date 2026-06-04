import { Badge, Icon } from '@core/ui';
import type { ActiveSession } from '../../data/sessions';
import { deviceIcon } from '../../data/sessions';

interface SessionRowProps {
  session: ActiveSession;
}

export function SessionRow({ session }: SessionRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-t border-hairline">
      <Icon name={deviceIcon(session.device)} size={16} className="text-text-muted" />
      <div className="flex-1">
        <div className="text-[12.5px] font-medium text-text-primary">
          {session.device}
          {session.active && <Badge tone="success" className="ml-1.5">Actif</Badge>}
        </div>
        <div className="text-[11px] font-mono text-text-muted">
          {session.location} · {session.last}
        </div>
      </div>
      {!session.active && (
        <button type="button" className="text-[12px] font-medium text-danger">Révoquer</button>
      )}
    </div>
  );
}
