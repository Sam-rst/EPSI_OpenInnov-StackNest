import { cn } from '../../../shared/lib/cn'

interface FilterEntry {
  value: string
  count?: number
}

interface FilterListProps {
  label: string
  entries: readonly FilterEntry[]
  active: string
  onSelect: (value: string) => void
  showCount?: boolean
}

const BASE_BTN =
  'w-full text-left px-2.5 h-8 rounded-md text-[12.5px] flex items-center justify-between transition'
const ACTIVE_BTN =
  'bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)] text-cyan font-medium'
const IDLE_BTN = 'text-text-secondary hover:bg-surface-sunken'

export function FilterList({
  label,
  entries,
  active,
  onSelect,
  showCount = false,
}: FilterListProps) {
  return (
    <div>
      <div className="text-text-muted mb-2 font-mono text-[11px] tracking-[0.14em] uppercase">
        {label}
      </div>
      <ul className="space-y-0.5">
        {entries.map((entry) => (
          <li key={entry.value}>
            <button
              type="button"
              onClick={() => onSelect(entry.value)}
              className={cn(BASE_BTN, active === entry.value ? ACTIVE_BTN : IDLE_BTN)}
            >
              <span>{entry.value}</span>
              {showCount && entry.count !== undefined && (
                <span className="text-text-muted text-[10px]">{entry.count}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
