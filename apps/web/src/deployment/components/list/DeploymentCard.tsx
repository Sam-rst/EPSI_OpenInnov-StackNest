import { Link } from 'react-router-dom'

import { formatDeploymentDate } from './formatDeploymentDate'
import { Badge, Icon } from '../../../shared/components/ui'
import { toneForStatus } from '../../types/enums/DeploymentStatus'
import type { Deployment } from '../../types/models/Deployment'

interface DeploymentCardProps {
  deployment: Deployment
}

/**
 * Carte d'un déploiement pour l'affichage mobile (< md), en remplacement de la
 * table qui déborde. Entièrement cliquable (lien natif → clavier inclus).
 */
export function DeploymentCard({ deployment }: DeploymentCardProps) {
  return (
    <Link
      to={`/deployments/${deployment.id}`}
      aria-label={`Voir le déploiement ${deployment.name}`}
      className="border-border bg-surface-elevated hover:bg-surface-sunken focus-visible:ring-cyan block rounded-lg border p-4 transition outline-none focus-visible:ring-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-text-primary inline-flex items-center gap-2 font-medium">
          <Icon name="box" size={15} className="text-cyan" />
          {deployment.name}
        </span>
        <Badge tone={toneForStatus(deployment.status)}>{deployment.statusLabel}</Badge>
      </div>

      <dl className="mt-3 space-y-1.5 text-[12px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-muted">Template</dt>
          <dd className="text-text-secondary font-mono">
            {/* Nom lisible du template si l'API le fournit, sinon l'UUID (#13). */}
            {deployment.templateName ?? deployment.templateId} · {deployment.version}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-muted">Accès</dt>
          <dd className="text-text-secondary font-mono">{deployment.accessUrl ?? '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-muted">Créé le</dt>
          <dd className="text-text-secondary">{formatDeploymentDate(deployment.createdAt)}</dd>
        </div>
      </dl>
    </Link>
  )
}
