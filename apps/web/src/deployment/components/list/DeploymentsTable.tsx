import { DeploymentCard } from './DeploymentCard'
import { DeploymentRow } from './DeploymentRow'
import { Card } from '../common/Card'
import type { Deployment } from '../../types/models/Deployment'

interface DeploymentsTableProps {
  deployments: readonly Deployment[]
}

const HEADERS: readonly string[] = ['Nom', 'Template', 'Statut', 'Accès', 'Créé le', '']

/**
 * Liste « ressources actives » des déploiements de l'utilisateur. Responsive :
 * table sur écran large (≥ md, scrollable horizontalement en sécurité), cartes
 * empilées sur petit écran pour ne plus déborder.
 */
export function DeploymentsTable({ deployments }: DeploymentsTableProps) {
  return (
    <>
      {/* Affichage large : table dense, masquée sous md. */}
      <Card className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-surface-sunken text-text-muted text-[11px] tracking-[0.06em] uppercase">
            <tr>
              {HEADERS.map((header, index) => (
                <th key={header || `col-${index}`} className="px-4 py-2.5 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deployments.map((deployment) => (
              <DeploymentRow key={deployment.id} deployment={deployment} />
            ))}
          </tbody>
        </table>
      </Card>

      {/* Affichage mobile : cartes empilées, masquées à partir de md. */}
      <div data-testid="deployments-cards" className="space-y-3 md:hidden">
        {deployments.map((deployment) => (
          <DeploymentCard key={deployment.id} deployment={deployment} />
        ))}
      </div>
    </>
  )
}
