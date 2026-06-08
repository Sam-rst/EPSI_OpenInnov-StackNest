import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { DeploymentsError } from '../components/list/DeploymentsError'
import { DeploymentsHeader } from '../components/list/DeploymentsHeader'
import { DeploymentsSkeleton } from '../components/list/DeploymentsSkeleton'
import { DeploymentsTable } from '../components/list/DeploymentsTable'
import { useDeployments } from '../hooks/useDeployments'

/**
 * Liste des déploiements de l'utilisateur, branchée sur l'API réelle. Affiche un
 * squelette au chargement, un état d'erreur avec réessai, un état vide honnête,
 * ou la table « ressources actives ».
 */
export function DeploymentsPage() {
  const navigate = useNavigate()
  const { deployments, loading, isError, refetch } = useDeployments()

  return (
    <div className="mx-auto max-w-[1280px] p-8">
      <DeploymentsHeader />

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

      {!loading && !isError && deployments.length > 0 && (
        <DeploymentsTable deployments={deployments} />
      )}
    </div>
  )
}
