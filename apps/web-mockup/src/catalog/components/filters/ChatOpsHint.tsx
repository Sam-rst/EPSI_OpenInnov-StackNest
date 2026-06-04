import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '@core/ui';
import { ROUTES } from '@core/routing/routes';

export function ChatOpsHint() {
  const navigate = useNavigate();
  return (
    <div className="rounded-md border border-border bg-surface-elevated p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="sparkles" size={13} className="text-sun" />
        <span className="text-[12px] font-semibold text-text-primary">Pas envie de chercher&nbsp;?</span>
      </div>
      <p className="text-[11.5px] leading-relaxed mb-2.5 text-text-secondary">
        Décris ton besoin en français, le ChatOps IA s'occupe du reste.
      </p>
      <Button size="sm" variant="cyan" icon="message-square" onClick={() => navigate(ROUTES.app.chat)}>
        Ouvrir ChatOps
      </Button>
    </div>
  );
}
