import { Icon } from '../../../shared/components/ui'

const TERMINAL_SHADOW = 'shadow-[0_18px_60px_-20px_rgba(3,34,51,0.18)]'
const TOAST_SHADOW =
  'shadow-[0_18px_60px_-20px_color-mix(in_oklch,var(--color-cyan)_45%,transparent)]'

/** Mockup persona « étudiant » : terminal de provisioning + toast de succès. */
export function PersonaMockupStudent() {
  return (
    <div className="w-full max-w-[420px] space-y-3">
      <div
        className={`border-border bg-surface-elevated overflow-hidden rounded-xl border ${TERMINAL_SHADOW}`}
      >
        <div className="border-border bg-surface-sunken flex h-9 items-center gap-2 border-b px-4">
          <span className="bg-success h-2 w-2 animate-pulse rounded-full" />
          <span className="text-text-secondary font-mono text-[11px]">pg-yassine-dev</span>
          <span className="text-text-muted ml-auto font-mono text-[10px]">00:07s</span>
        </div>
        <div className="text-text-secondary space-y-1.5 p-4 font-mono text-[11.5px] leading-[1.7]">
          <div>
            <span className="text-text-muted">$</span> stacknest provision postgres
          </div>
          <div className="text-success">✓ Volume créé</div>
          <div className="text-success">✓ Conteneur démarré</div>
          <div className="text-success">✓ Healthcheck OK</div>
        </div>
      </div>
      <div className={`border-cyan bg-surface-elevated rounded-xl border-2 p-4 ${TOAST_SHADOW}`}>
        <div className="flex items-center gap-3">
          <div className="text-cyan flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_18%,transparent)]">
            <Icon name="check" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-text-primary text-[13.5px] font-semibold">Ta BDD est prête.</div>
            <div className="text-text-muted mt-0.5 truncate font-mono text-[10.5px]">
              postgresql://localhost:5432/yassine_dev
            </div>
          </div>
          <button
            type="button"
            className="bg-cyan h-7 rounded-md px-2.5 text-[11px] font-medium whitespace-nowrap text-white"
          >
            Copier
          </button>
        </div>
      </div>
    </div>
  )
}
