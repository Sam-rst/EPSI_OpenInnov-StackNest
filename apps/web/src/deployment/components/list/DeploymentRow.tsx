import { Link } from 'react-router-dom'

import { Badge, Icon } from '../../../shared/components/ui'
import { toneForStatus } from '../../types/enums/DeploymentStatus'
import type { Deployment } from '../../types/models/Deployment'

interface DeploymentRowProps {
  deployment: Deployment
}

function formatDate(iso: string | null): string {
  if (iso === null) {
    return '—'
  }
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('fr-FR')
}

/** Ligne de la table des déploiements : nom · template+version · statut · accès · date. */
export function DeploymentRow({ deployment }: DeploymentRowProps) {
  return (
    <tr className="border-border hover:bg-surface-sunken border-t transition">
      <td className="px-4 py-3">
        <Link
          to={`/deployments/${deployment.id}`}
          className="text-text-primary hover:text-cyan inline-flex items-center gap-2 font-medium transition"
        >
          <Icon name="box" size={15} className="text-cyan" />
          {deployment.name}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="text-text-secondary font-mono text-[12px]">
          {/* Nom lisible du template si l'API le fournit, sinon l'UUID (#13). */}
          {deployment.templateName ?? deployment.templateId} · {deployment.version}
        </span>
      </td>
      <td className="px-4 py-3">
        <Badge tone={toneForStatus(deployment.status)}>{deployment.statusLabel}</Badge>
      </td>
      <td className="text-text-secondary px-4 py-3 font-mono text-[12px]">
        {deployment.accessUrl ?? '—'}
      </td>
      <td className="text-text-muted px-4 py-3 text-[12px]">{formatDate(deployment.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        <Link
          to={`/deployments/${deployment.id}`}
          className="text-cyan inline-flex items-center gap-1 text-[12.5px] font-medium hover:underline"
        >
          Voir
          <Icon name="arrow-right" size={13} />
        </Link>
      </td>
    </tr>
  )
}
