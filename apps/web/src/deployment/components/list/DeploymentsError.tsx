import { Button, Icon } from '../../../shared/components/ui'

interface DeploymentsErrorProps {
  onRetry: () => void
}

/** État d'erreur honnête de la liste, avec action de réessai. */
export function DeploymentsError({ onRetry }: DeploymentsErrorProps) {
  return (
    <div className="border-border text-text-muted flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
      <span className="text-error flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_oklch,#c42b1c_14%,transparent)]">
        <Icon name="triangle-alert" size={22} />
      </span>
      <div className="text-text-secondary mt-4 text-[14px] font-semibold">
        Impossible de charger les déploiements
      </div>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed">
        Une erreur est survenue. Réessaie dans un instant.
      </p>
      <Button variant="secondary" icon="refresh-cw" className="mt-5" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  )
}
