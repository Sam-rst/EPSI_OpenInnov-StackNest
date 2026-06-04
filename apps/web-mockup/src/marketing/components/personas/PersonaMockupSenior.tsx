import { Badge, Icon } from '@core/ui';

const SHADOW = 'shadow-[0_18px_60px_-20px_rgba(3,34,51,0.18)]';

export function PersonaMockupSenior() {
  return (
    <div className="w-full max-w-[420px]">
      <div className={`rounded-xl border border-border bg-surface-elevated p-5 ${SHADOW}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Environnements</div>
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 h-5 rounded bg-[color-mix(in_oklch,var(--brand-success)_18%,transparent)] text-success">
            <span className="w-1 h-1 rounded-full bg-success" /> isolés
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="rounded-lg border border-border p-3.5 bg-surface-sunken">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-[color-mix(in_oklch,var(--brand-yellow)_22%,transparent)] text-[#9b5805]">
                <Icon name="globe" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-text-primary">pg-prod-eu</div>
                <div className="font-mono text-[10.5px] text-text-muted">partagé · production</div>
              </div>
              <Badge tone="warn">protégé</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-4 text-[10.5px] font-mono text-text-muted">
            <Icon name="copy" size={12} /> répliqué &amp; isolé ↓
          </div>
          <div className="rounded-lg border-2 border-cyan p-3.5 bg-[color-mix(in_oklch,var(--brand-cyan)_6%,transparent)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-[color-mix(in_oklch,var(--brand-cyan)_22%,transparent)] text-cyan">
                <Icon name="shield" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-text-primary">pg-yassine-sandbox</div>
                <div className="font-mono text-[10.5px] text-text-muted">privé · TTL 24h</div>
              </div>
              <Badge tone="cyan">à toi</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
