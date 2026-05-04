import { Icon } from '@core/ui';

const TERMINAL_SHADOW = 'shadow-[0_18px_60px_-20px_rgba(3,34,51,0.18)]';
const TOAST_SHADOW = 'shadow-[0_18px_60px_-20px_color-mix(in_oklch,var(--brand-cyan)_45%,transparent)]';

export function PersonaMockupStudent() {
  return (
    <div className="w-full max-w-[420px] space-y-3">
      <div className={`rounded-xl border border-border bg-surface-elevated overflow-hidden ${TERMINAL_SHADOW}`}>
        <div className="flex items-center gap-2 px-4 h-9 border-b border-border bg-surface-sunken">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-[11px] text-text-secondary">pg-yassine-dev</span>
          <span className="ml-auto font-mono text-[10px] text-text-muted">00:07s</span>
        </div>
        <div className="p-4 space-y-1.5 font-mono text-[11.5px] leading-[1.7] text-text-secondary">
          <div><span className="text-text-muted">$</span> stacknest provision postgres</div>
          <div className="text-success">✓ Volume créé</div>
          <div className="text-success">✓ Conteneur démarré</div>
          <div className="text-success">✓ Healthcheck OK</div>
        </div>
      </div>
      <div className={`rounded-xl border-2 border-cyan bg-surface-elevated p-4 ${TOAST_SHADOW}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-[color-mix(in_oklch,var(--brand-cyan)_18%,transparent)] text-cyan">
            <Icon name="check" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold text-text-primary">Ta BDD est prête.</div>
            <div className="font-mono text-[10.5px] mt-0.5 truncate text-text-muted">
              postgresql://localhost:5432/yassine_dev
            </div>
          </div>
          <button type="button" className="text-[11px] font-medium px-2.5 h-7 rounded-md whitespace-nowrap bg-cyan text-white">
            Copier
          </button>
        </div>
      </div>
    </div>
  );
}
