import { Link } from 'react-router-dom'

import { Badge, Icon } from '../../../shared/components/ui'
import { toneForStatus } from '../../types/enums/DeploymentStatus'
import type { Deployment } from '../../types/models/Deployment'

interface DeployHeaderProps {
  deployment: Deployment
  /** Statut courant (peut différer du statut persisté pendant la progression). */
  liveStatusLabel: string
  liveStatusTone: ReturnType<typeof toneForStatus>
}

/** En-tête de la page détail : retour, nom, template/version et badge statut live. */
export function DeployHeader({ deployment, liveStatusLabel, liveStatusTone }: DeployHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        to="/deployments"
        className="text-text-muted hover:text-cyan mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium transition"
      >
        <Icon name="arrow-left" size={14} />
        Retour aux déploiements
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-cyan flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
          <Icon name="box" size={22} />
        </span>
        <div className="mr-2">
          <h1 className="text-text-primary text-[24px] font-bold tracking-[-0.02em]">
            {deployment.name}
          </h1>
          <p className="text-text-muted font-mono text-[12.5px]">
            {deployment.templateId} · {deployment.version}
          </p>
        </div>
        <Badge tone={liveStatusTone}>{liveStatusLabel}</Badge>
      </div>
    </div>
  )
}
