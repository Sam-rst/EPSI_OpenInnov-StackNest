import { Icon } from '@core/ui';

const COLS = ['Nom', 'Type', 'Env', 'Statut', 'Coût/mois', 'Owner', 'Créé', ''];

export function ActiveTableHeader() {
  return (
    <thead className="bg-surface-sunken">
      <tr className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-text-muted">
        {COLS.map((col, i) => (
          <th
            key={col || `empty-${i}`}
            className={`${i === 4 ? 'text-right' : 'text-left'} ${i === 0 ? 'px-5' : 'px-3'} py-2.5 font-medium`}
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function ActiveTableToolbar() {
  return (
    <div className="flex items-center justify-between px-5 h-12 border-b border-border">
      <div className="text-[14px] font-semibold tracking-tight text-text-primary">
        Ressources actives
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="text-[11.5px] flex items-center gap-1.5 px-2 h-7 rounded border border-border text-text-secondary">
          <Icon name="filter" size={12} /> Filtrer
        </button>
        <button type="button" className="text-[11.5px] flex items-center gap-1.5 px-2 h-7 rounded border border-border text-text-secondary">
          <Icon name="arrow-down-up" size={12} /> Trier
        </button>
      </div>
    </div>
  );
}
