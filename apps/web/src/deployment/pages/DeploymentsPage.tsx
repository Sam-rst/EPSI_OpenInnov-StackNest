import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { BulkActionsBar } from '../components/list/BulkActionsBar'
import { BulkFeedbackBanner } from '../components/list/BulkFeedbackBanner'
import { DeploymentsError } from '../components/list/DeploymentsError'
import { DeploymentsHeader } from '../components/list/DeploymentsHeader'
import { DeploymentsSkeleton } from '../components/list/DeploymentsSkeleton'
import { DeploymentsTable, type TableSelection } from '../components/list/DeploymentsTable'
import { useDeploymentBulkActions } from '../hooks/useDeploymentBulkActions'
import { useDeployments } from '../hooks/useDeployments'

/**
 * Liste des déploiements de l'utilisateur, branchée sur l'API réelle. Affiche un
 * squelette au chargement, un état d'erreur avec réessai, un état vide honnête,
 * ou la table « ressources actives » avec sélection multiple et actions groupées
 * (arrêter / démarrer / supprimer) orchestrées en fan-out.
 */
export function DeploymentsPage() {
  const navigate = useNavigate()
  const { deployments, loading, isError, refetch } = useDeployments()
  const bulk = useDeploymentBulkActions(deployments)

  const tableSelection: TableSelection = {
    allSelected: bulk.selection.allSelected,
    someSelected: bulk.selection.someSelected,
    onToggleAll: bulk.selection.toggleAll,
    isSelected: bulk.selection.isSelected,
    onToggle: bulk.selection.toggle,
  }

  const hasDeployments = !loading && !isError && deployments.length > 0

  return (
    <div className="mx-auto max-w-[1280px] p-8">
      <DeploymentsHeader />

      {bulk.feedback && (
        <BulkFeedbackBanner message={bulk.feedback} onDismiss={bulk.dismissFeedback} />
      )}

      {hasDeployments && (
        <BulkActionsBar
          count={bulk.selection.count}
          availability={bulk.availability}
          isRunning={bulk.isRunning}
          onAction={(action) => void bulk.runAction(action)}
          onClear={bulk.selection.clear}
        />
      )}

      {loading && <DeploymentsSkeleton />}

      {!loading && isError && <DeploymentsError onRetry={refetch} />}

      {!loading && !isError && deployments.length === 0 && (
        <EmptyState
          icon="server"
          title="Aucun déploiement"
          description="Provisionne ta première ressource depuis le catalogue."
          actionLabel="Aller au catalogue"
          onAction={() => navigate('/catalog')}
        />
      )}

      {hasDeployments && <DeploymentsTable deployments={deployments} selection={tableSelection} />}
    </div>
  )
}
