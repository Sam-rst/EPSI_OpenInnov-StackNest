import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { Icon } from '../../shared/components/ui'
import { CredentialsCard } from '../components/detail/CredentialsCard'
import { DeployHeader } from '../components/detail/DeployHeader'
import { DetailsCard } from '../components/detail/DetailsCard'
import { LifecycleActions } from '../components/detail/LifecycleActions'
import { Stepper } from '../components/detail/Stepper'
import { StreamedLogs } from '../components/detail/StreamedLogs'
import { useDeployment } from '../hooks/useDeployment'
import { useDeploymentEvents } from '../hooks/useDeploymentEvents'
import { DeploymentStatus, labelForStatus, toneForStatus } from '../types/enums/DeploymentStatus'
import { DeploymentStep } from '../types/enums/DeploymentStep'

function BackLink() {
  return (
    <Link
      to="/deployments"
      className="text-text-muted hover:text-cyan mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition"
    >
      <Icon name="arrow-left" size={14} />
      Retour aux déploiements
    </Link>
  )
}

/**
 * Page de suivi d'un déploiement (display-only) : header + badge statut +
 * stepper Docker + logs streamés (simulés) + détails + accès (au running) +
 * actions de cycle de vie. La progression et les logs sont d'EXEMPLE.
 */
export function DeploymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { deployment, loading, isError } = useDeployment(id)
  const events = useDeploymentEvents(id)

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-8">
        <BackLink />
        <p className="text-text-muted text-[13.5px]">Chargement du déploiement…</p>
      </div>
    )
  }

  if (isError || !deployment) {
    return (
      <div className="mx-auto max-w-[1280px] p-8">
        <BackLink />
        <EmptyState
          icon="server-off"
          title="Déploiement introuvable"
          description="Ce déploiement n'existe pas ou n'est plus disponible."
        />
      </div>
    )
  }

  // Statut affiché : la progression simulée prime dès qu'elle a démarré, sinon
  // on retombe sur le statut persisté de la ressource.
  const hasProgressed = events.logs.length > 0
  const liveStatus = hasProgressed ? events.status : deployment.status
  const failed = liveStatus === DeploymentStatus.FAILED
  const currentStep =
    liveStatus === DeploymentStatus.RUNNING ? DeploymentStep.READY : events.currentStep
  const showCredentials = liveStatus === DeploymentStatus.RUNNING && events.access !== undefined

  return (
    <div className="mx-auto max-w-[1280px] p-8">
      <DeployHeader
        deployment={deployment}
        liveStatusLabel={labelForStatus(liveStatus)}
        liveStatusTone={toneForStatus(liveStatus)}
      />
      <Stepper currentStep={currentStep} failed={failed} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <StreamedLogs logs={events.logs} isDone={events.isDone} />
        <div className="space-y-4">
          <DetailsCard deployment={deployment} />
          {showCredentials && events.access && <CredentialsCard access={events.access} />}
          <LifecycleActions deploymentId={deployment.id} status={liveStatus} />
        </div>
      </div>
    </div>
  )
}
