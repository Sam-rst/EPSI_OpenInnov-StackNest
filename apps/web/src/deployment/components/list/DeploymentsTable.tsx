import { DeploymentRow } from './DeploymentRow'
import { Card } from '../common/Card'
import type { Deployment } from '../../types/models/Deployment'

interface DeploymentsTableProps {
  deployments: readonly Deployment[]
}

const HEADERS: readonly string[] = ['Nom', 'Template', 'Statut', 'Accès', 'Créé le', '']

/** Table « ressources actives » des déploiements de l'utilisateur. */
export function DeploymentsTable({ deployments }: DeploymentsTableProps) {
  return (
    <Card className="overflow-hidden">
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
  )
}
