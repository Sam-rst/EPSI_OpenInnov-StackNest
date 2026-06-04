import { Icon } from '@core/ui';

export function TopbarSearch() {
  return (
    <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface min-w-[280px]">
      <Icon name="search" size={13} className="opacity-60" />
      <input
        placeholder="Rechercher ressources, déploiements, users…"
        className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-text-muted text-text-primary"
      />
      <kbd className="font-mono text-[10px] px-1.5 h-5 inline-flex items-center rounded border border-border text-text-muted">
        ⌘K
      </kbd>
    </div>
  );
}
