import { Card } from '@core/ui';

const DETAILS: ReadonlyArray<readonly [string, string]> = [
  ['Type', 'PostgreSQL 16.4'],
  ['Provider', 'Docker'],
  ['Région', 'eu-west-3'],
  ['Environnement', 'prod'],
  ['Taille', 'medium · 2 vCPU · 4 GB'],
  ['Volume', '50 GB SSD'],
  ['Backups', 'Quotidiens (30j)'],
];

export function DeployDetailsCard() {
  return (
    <Card className="p-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] mb-3 text-text-muted">
        Détails
      </div>
      <dl className="space-y-2.5 text-[12px]">
        {DETAILS.map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3">
            <dt className="text-text-muted">{key}</dt>
            <dd className="font-mono text-right text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
