import { Icon } from '../../../shared/components/ui'

interface SearchFilterProps {
  value: string
  onChange: (value: string) => void
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  return (
    <div>
      <div className="text-text-muted mb-2 font-mono text-[11px] tracking-[0.14em] uppercase">
        Recherche
      </div>
      <div className="border-border bg-surface-elevated flex h-9 items-center gap-2 rounded-md border px-3">
        <Icon name="search" size={13} className="opacity-60" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Postgres, Redis…"
          className="text-text-primary flex-1 bg-transparent text-[12.5px] outline-none"
        />
      </div>
    </div>
  )
}
