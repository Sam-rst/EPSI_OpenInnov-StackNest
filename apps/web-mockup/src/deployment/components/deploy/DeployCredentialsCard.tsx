import { Button, Card, Icon } from '@core/ui';

export function DeployCredentialsCard() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="key" size={13} className="text-cyan" />
        <span className="text-[12px] font-semibold text-text-primary">Identifiants</span>
      </div>
      <div className="font-mono text-[11px] space-y-1.5 text-text-secondary">
        <div><span className="text-text-muted">host </span> pg-prod-eu.stack.local</div>
        <div><span className="text-text-muted">port </span> 5432</div>
        <div><span className="text-text-muted">user </span> stacknest_admin</div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">pwd </span> •••••••••
          <button type="button" className="text-cyan">
            <Icon name="eye" size={11} />
          </button>
        </div>
      </div>
      <Button variant="secondary" size="sm" icon="copy" className="mt-3 w-full">
        Copier la chaîne
      </Button>
    </Card>
  );
}
