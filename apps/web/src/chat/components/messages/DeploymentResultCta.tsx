import { useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/ui'

interface DeploymentResultCtaProps {
  /** Déploiement créé par l'action confirmée (cible de la navigation). */
  deploymentId: string
}

/** Construit l'URL du détail de suivi du déploiement créé. */
function detailUrlFor(deploymentId: string): string {
  return `/deployments/${deploymentId}`
}

/**
 * CTA affiché sous une carte d'action `deploy` exécutée avec succès (item #7) :
 * « Voir le déploiement → » mène au suivi du déploiement créé. On privilégie un
 * appel à l'action VISIBLE plutôt qu'une redirection automatique qui éjecterait
 * l'utilisateur du chat : il décide quand basculer vers le suivi.
 */
export function DeploymentResultCta({ deploymentId }: DeploymentResultCtaProps) {
  const navigate = useNavigate()

  return (
    <div className="mt-3">
      <Button
        variant="cyan"
        size="sm"
        iconRight="arrow-right"
        onClick={() => navigate(detailUrlFor(deploymentId))}
      >
        Voir le déploiement
      </Button>
    </div>
  )
}
