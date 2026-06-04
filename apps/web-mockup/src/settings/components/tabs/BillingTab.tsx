import { Button, Card } from '@core/ui';
import { StatTile } from '../forms/StatTile';

const PlanCard = () => (
  <div className="rounded-md p-5 border-2 border-cyan bg-[color-mix(in_oklch,var(--brand-cyan)_6%,transparent)]">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[20px] font-bold text-text-primary">Plan Team</div>
        <div className="text-[12px] text-text-muted">
          Jusqu'à 25 membres · ressources illimitées
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono font-bold text-[28px] text-text-primary">
          49 €<span className="text-[14px] font-normal text-text-muted">/mois</span>
        </div>
      </div>
    </div>
  </div>
);

export function BillingTab() {
  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-semibold mb-1 text-text-primary">Plan actuel</h2>
      <p className="text-[12.5px] mb-5 text-text-muted">
        StackNest Lab — workspace EPSI OpenInnov.
      </p>
      <PlanCard />
      <div className="mt-5 grid grid-cols-3 gap-3 text-[12.5px]">
        <StatTile label="Ressources actives" value="24 / ∞" />
        <StatTile label="Membres" value="7 / 25" />
        <StatTile label="Coût ce mois" value="487 €" />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary">Voir factures</Button>
        <Button variant="primary">Mettre à niveau</Button>
      </div>
    </Card>
  );
}
