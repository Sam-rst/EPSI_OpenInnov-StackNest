import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatDeploymentDate } from './formatDeploymentDate'
import { SelectionCheckbox } from './SelectionCheckbox'
import type { RowSelection } from './rowSelection'
import { Badge, Icon } from '../../../shared/components/ui'
import { toneForStatus } from '../../types/enums/DeploymentStatus'
import type { Deployment } from '../../types/models/Deployment'

interface DeploymentRowProps {
  deployment: Deployment
  /** État de sélection injecté quand le mode sélection multiple est actif. */
  selection?: RowSelection
}

/** Touches qui activent un lien accessible (parité avec un clic). */
const ACTIVATION_KEYS: ReadonlySet<string> = new Set(['Enter', ' '])

/**
 * Ligne de la table des déploiements : (case) · nom · template+version · statut · accès · date.
 * Toute la ligne est un lien accessible vers le détail (clic + clavier Enter/Espace).
 * La case à cocher (mode sélection) stoppe la propagation pour ne pas naviguer.
 */
export function DeploymentRow({ deployment, selection }: DeploymentRowProps) {
  const navigate = useNavigate()
  const detailPath = `/deployments/${deployment.id}`

  function goToDetail() {
    navigate(detailPath)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (ACTIVATION_KEYS.has(event.key)) {
      event.preventDefault()
      goToDetail()
    }
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Voir le déploiement ${deployment.name}`}
      onClick={goToDetail}
      onKeyDown={handleKeyDown}
      className="border-border hover:bg-surface-sunken focus-visible:ring-cyan cursor-pointer border-t transition outline-none focus-visible:ring-2 focus-visible:ring-inset"
    >
      {selection && (
        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
          <SelectionCheckbox
            checked={selection.selected}
            onChange={selection.onToggle}
            label={`Sélectionner ${deployment.name}`}
          />
        </td>
      )}
      <td className="px-4 py-3">
        <span className="text-text-primary inline-flex items-center gap-2 font-medium">
          <Icon name="box" size={15} className="text-cyan" />
          {deployment.name}
        </span>
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
      <td className="text-text-muted px-4 py-3 text-[12px]">
        {formatDeploymentDate(deployment.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-cyan inline-flex items-center gap-1 text-[12.5px] font-medium">
          Voir
          <Icon name="arrow-right" size={13} />
        </span>
      </td>
    </tr>
  )
}
