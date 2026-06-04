import { KpiCard, type Kpi } from './KpiCard';
import { KPIS } from '../data/dashboard.fixtures';

const KPI_LIST: ReadonlyArray<Kpi> = [
  { label: 'Ressources actives', value: KPIS.activeResources, suffix: '',  icon: 'layers',         color: 'var(--brand-cyan)',    delta: '+3',    up: true },
  { label: 'Coût ce mois',       value: KPIS.monthlyCost,     suffix: ' €', icon: 'wallet',         color: 'var(--brand-yellow)',  delta: '+8 %',  up: true },
  { label: 'Déploiements / 24h', value: KPIS.deploymentsToday, suffix: '', icon: 'rocket',         color: 'var(--brand-success)', delta: '+4',    up: true },
  { label: 'Échecs (7j)',        value: KPIS.failures7d,      suffix: '',  icon: 'alert-triangle', color: 'var(--brand-error)',   delta: '-1',    up: false },
];

export function KpiGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {KPI_LIST.map((kpi, i) => (
        <KpiCard key={kpi.label} kpi={kpi} index={i} />
      ))}
    </div>
  );
}
