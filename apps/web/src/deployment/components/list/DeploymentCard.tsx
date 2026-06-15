import { Link } from 'react-router-dom'

import { formatDeploymentDate } from './formatDeploymentDate'
import { SelectionCheckbox } from './SelectionCheckbox'
import type { RowSelection } from './rowSelection'
import { Badge, Icon } from '../../../shared/components/ui'
import { toneForStatus } from '../../types/enums/DeploymentStatus'
import type { Deployment } from '../../types/models/Deployment'

interface DeploymentCardProps {
  deployment: Deployment
  /** État de sélection injecté quand le mode sélection multiple est actif. */
  selection?: RowSelection
}

/**
 * Carte d'un déploiement pour l'affichage mobile (< md), en remplacement de la
 * table qui déborde. Entièrement cliquable (lien natif → clavier inclus). En mode
 * sélection, une case à cocher est superposée en haut à gauche : son conteneur
 * stoppe la propagation pour cocher sans suivre le lien.
 */
export function DeploymentCard({ deployment, selection }: DeploymentCardProps) {
  return (
    <div className="relative">
      {selection && (
        // Conteneur de POSITIONNEMENT non interactif : son seul `onClick` empeche
        // le clic (souris) sur la case de remonter au <Link> parent et de
        // declencher la navigation. L'accessibilite clavier est entierement
        // portee par <SelectionCheckbox> (vrai input focusable) : ce div n'a donc
        // pas besoin de gestionnaire clavier. `role="presentation"` l'explicite et
        // leve le faux positif SonarCloud S1082 (element non interactif).
        <div
          role="presentation"
          className="absolute top-3 left-3 z-10"
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
          }}
        >
          <SelectionCheckbox
            checked={selection.selected}
            onChange={selection.onToggle}
            label={`Sélectionner ${deployment.name}`}
          />
        </div>
      )}
      <Link
        to={`/deployments/${deployment.id}`}
        aria-label={`Voir le déploiement ${deployment.name}`}
        className={`border-border bg-surface-elevated hover:bg-surface-sunken focus-visible:ring-cyan block rounded-lg border p-4 transition outline-none focus-visible:ring-2 ${
          selection ? 'pl-10' : ''
        }`}
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
    </div>
  )
}
