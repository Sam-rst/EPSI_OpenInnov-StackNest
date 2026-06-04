import { Icon } from '@core/ui';

export function StreamedLogsHeader() {
  return (
    <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-surface-sunken">
      <div className="flex items-center gap-2">
        <Icon name="terminal" size={13} className="text-cyan" />
        <span className="font-mono text-[12px] text-text-primary">Logs streamés</span>
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono px-1.5 h-4 rounded bg-[color-mix(in_oklch,var(--brand-success)_18%,transparent)] text-success">
          <span className="w-1 h-1 rounded-full bg-success animate-pulse" /> live
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <button type="button" className="hover:text-text-primary">
          <Icon name="filter" size={12} className="inline mr-1" />Filtrer
        </button>
        <button type="button" className="hover:text-text-primary">
          <Icon name="copy" size={12} className="inline mr-1" />Copier
        </button>
      </div>
    </div>
  );
}
