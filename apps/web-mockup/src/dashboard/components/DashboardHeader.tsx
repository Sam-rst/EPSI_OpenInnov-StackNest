import { Button } from '@core/ui';

export function DashboardHeader() {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text-primary">Dashboard</h1>
        <p className="text-[13px] mt-1 text-text-secondary">
          Vue d'ensemble du workspace · 30 derniers jours
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" icon="download">Exporter CSV</Button>
        <Button variant="primary" icon="plus">Nouveau déploiement</Button>
      </div>
    </div>
  );
}
