import { Icon } from '@core/ui';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] mb-2 text-text-muted">Recherche</div>
      <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface-elevated">
        <Icon name="search" size={13} className="opacity-60" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Postgres, Redis…"
          className="flex-1 bg-transparent outline-none text-[12.5px] text-text-primary"
        />
      </div>
    </div>
  );
}
