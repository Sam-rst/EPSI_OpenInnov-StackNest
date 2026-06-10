import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { Icon } from '../../shared/components/ui'
import { CredentialsCard } from '../components/detail/CredentialsCard'
import { DeployHeader } from '../components/detail/DeployHeader'
import { DetailsCard } from '../components/detail/DetailsCard'
import { LifecycleActions } from '../components/detail/LifecycleActions'
import { Stepper } from '../components/detail/Stepper'
import { StreamedLogs } from '../components/detail/StreamedLogs'
import { stepperViewForStatus } from '../components/detail/stepperView'
import { useDeployment } from '../hooks/useDeployment'
import { useDeploymentEvents } from '../hooks/useDeploymentEvents'
import { DeploymentStatus, labelForStatus, toneForStatus } from '../types/enums/DeploymentStatus'

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
 * Page de suivi d'un déploiement : header + badge statut + stepper Docker (phase
 * de provisioning uniquement, #15) + logs streamés via SSE + détails + accès (au
 * running) + actions de cycle de vie. Branchée sur l'API réelle (REST + SSE).
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

  // Statut affiché : le flux SSE prime dès qu'il a émis un état (log reçu, accès
  // livré, statut sorti de l'état initial, ou flux terminé) ; sinon on retombe
  // sur le statut persisté de la ressource (chargé en REST).
  const hasProgressed =
    events.logs.length > 0 ||
    events.access !== undefined ||
    events.isDone ||
    events.status !== DeploymentStatus.PENDING
  const liveStatus = hasProgressed ? events.status : deployment.status
  const stepper = stepperViewForStatus(liveStatus)
  // En provisioning, on affine l'étape avec la progression live ; sinon on s'en
  // tient à l'étape de référence du statut (Prêt au running, figée à l'échec).
  const currentStep =
    liveStatus === DeploymentStatus.PROVISIONING ? events.currentStep : stepper.currentStep
  const showCredentials = liveStatus === DeploymentStatus.RUNNING && events.access !== undefined
  // Provisioning en cours : on attend des logs live. Sinon (déjà en ligne / arrêté
  // / échoué à l'ouverture), aucun log à rejouer — pub/sub éphémère — on l'affiche
  // honnêtement plutôt qu'un « en attente » + pastille « live » trompeurs.
  const provisioning =
    liveStatus === DeploymentStatus.PENDING || liveStatus === DeploymentStatus.PROVISIONING

  return (
    <div className="mx-auto max-w-[1280px] p-8">
      <DeployHeader
        deployment={deployment}
        liveStatusLabel={labelForStatus(liveStatus)}
        liveStatusTone={toneForStatus(liveStatus)}
      />
      {stepper.show && (
        <Stepper currentStep={currentStep} failed={stepper.failed} completed={stepper.completed} />
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <StreamedLogs logs={events.logs} isDone={events.isDone} provisioning={provisioning} />
        <div className="space-y-4">
          <DetailsCard deployment={deployment} />
          {showCredentials && events.access && (
            <CredentialsCard access={events.access} username={deployment.connectionUsername} />
          )}
          <LifecycleActions deploymentId={deployment.id} status={liveStatus} />
        </div>
      </div>
    </div>
  )
}
