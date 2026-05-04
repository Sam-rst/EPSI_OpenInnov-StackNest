import { Button, Card, Icon } from '@core/ui';
import { ACTIVE_SESSIONS } from '../../data/sessions';
import { SessionRow } from './SessionRow';

const TwoFactorCard = () => (
  <Card className="p-6">
    <h2 className="text-[15px] font-semibold mb-1 text-text-primary">
      Authentification à deux facteurs
    </h2>
    <p className="text-[12.5px] mb-5 text-text-muted">Ajoute une couche supplémentaire de protection.</p>
    <div className="flex items-center gap-3 p-4 rounded-md border border-border bg-surface">
      <span className="w-10 h-10 rounded-md flex items-center justify-center bg-[color-mix(in_oklch,var(--brand-success)_14%,transparent)] text-success">
        <Icon name="shield-check" size={18} />
      </span>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-text-primary">2FA activé · App authenticator</div>
        <div className="text-[11.5px] text-text-muted">Configuré il y a 47 jours · 2 backup codes restants</div>
      </div>
      <Button variant="secondary" size="sm">Régénérer</Button>
    </div>
  </Card>
);

const SessionsCard = () => (
  <Card className="p-6">
    <h2 className="text-[15px] font-semibold mb-1 text-text-primary">Sessions actives</h2>
    <p className="text-[12.5px] mb-4 text-text-muted">3 appareils connectés à ton compte.</p>
    {ACTIVE_SESSIONS.map((session) => (
      <SessionRow key={session.device} session={session} />
    ))}
  </Card>
);

export function SecurityTab() {
  return (
    <>
      <TwoFactorCard />
      <SessionsCard />
    </>
  );
}
