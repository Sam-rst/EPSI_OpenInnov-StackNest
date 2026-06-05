import { Badge, Icon } from '../../../shared/components/ui'

const SHADOW = 'shadow-[0_18px_60px_-20px_rgba(3,34,51,0.18)]'

/** Mockup persona « dev senior » : environnements partagé vs sandbox isolé. */
export function PersonaMockupSenior() {
  return (
    <div className="w-full max-w-[420px]">
      <div className={`border-border bg-surface-elevated rounded-xl border p-5 ${SHADOW}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-text-muted font-mono text-[11px] tracking-[0.14em] uppercase">
            Environnements
          </div>
          <div className="text-success inline-flex h-5 items-center gap-1.5 rounded bg-[color-mix(in_oklch,var(--color-success)_18%,transparent)] px-2 font-mono text-[10.5px]">
            <span className="bg-success h-1 w-1 rounded-full" /> isolés
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="border-border bg-surface-sunken rounded-lg border p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-yellow)_22%,transparent)] text-[#9b5805]">
                <Icon name="globe" size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-text-primary text-[12.5px] font-semibold">pg-prod-eu</div>
                <div className="text-text-muted font-mono text-[10.5px]">partagé · production</div>
              </div>
              <Badge tone="warn">protégé</Badge>
            </div>
          </div>
          <div className="text-text-muted flex items-center gap-2 pl-4 font-mono text-[10.5px]">
            <Icon name="copy" size={12} /> répliqué &amp; isolé ↓
          </div>
          <div className="border-cyan rounded-lg border-2 bg-[color-mix(in_oklch,var(--color-cyan)_6%,transparent)] p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="text-cyan flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_22%,transparent)]">
                <Icon name="shield" size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-text-primary text-[12.5px] font-semibold">pg-john-sandbox</div>
                <div className="text-text-muted font-mono text-[10.5px]">privé · TTL 24h</div>
              </div>
              <Badge tone="cyan">à toi</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
