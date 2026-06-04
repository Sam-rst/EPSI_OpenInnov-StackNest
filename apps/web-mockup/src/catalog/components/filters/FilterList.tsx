interface FilterEntry {
  value: string;
  count?: number;
}

interface FilterListProps {
  label: string;
  entries: ReadonlyArray<FilterEntry>;
  active: string;
  onSelect: (value: string) => void;
  showCount?: boolean;
}

const baseBtn = 'w-full text-left px-2.5 h-8 rounded-md text-[12.5px] flex items-center justify-between transition';
const activeBtn = 'bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan font-medium';
const idleBtn = 'text-text-secondary hover:bg-surface-sunken';

export function FilterList({ label, entries, active, onSelect, showCount = false }: FilterListProps) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] mb-2 text-text-muted">{label}</div>
      <ul className="space-y-0.5">
        {entries.map((entry) => (
          <li key={entry.value}>
            <button
              type="button"
              onClick={() => onSelect(entry.value)}
              className={`${baseBtn} ${active === entry.value ? activeBtn : idleBtn}`}
            >
              <span>{entry.value}</span>
              {showCount && entry.count !== undefined && (
                <span className="text-[10px] text-text-muted">{entry.count}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
