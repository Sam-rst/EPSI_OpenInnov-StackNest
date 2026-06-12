import { DeploymentCard } from './DeploymentCard'
import { DeploymentRow } from './DeploymentRow'
import { SelectionCheckbox } from './SelectionCheckbox'
import type { RowSelection } from './rowSelection'
import { Card } from '../common/Card'
import type { Deployment } from '../../types/models/Deployment'

/** API de sélection multiple injectée par la liste (table + cartes). */
export interface TableSelection {
  allSelected: boolean
  someSelected: boolean
  onToggleAll: () => void
  isSelected: (id: string) => boolean
  onToggle: (id: string) => void
}

interface DeploymentsTableProps {
  deployments: readonly Deployment[]
  /** Quand fourni, active la sélection multiple (cases par ligne + en-tête). */
  selection?: TableSelection
}

const HEADERS: readonly string[] = ['Nom', 'Template', 'Statut', 'Accès', 'Créé le', '']

/** Construit l'état de sélection d'une ligne donnée, ou `undefined` hors mode. */
function rowSelectionFor(
  selection: TableSelection | undefined,
  deploymentId: string,
): RowSelection | undefined {
  if (!selection) {
    return undefined
  }
  return {
    selected: selection.isSelected(deploymentId),
    onToggle: () => selection.onToggle(deploymentId),
  }
}

/**
 * Liste « ressources actives » des déploiements de l'utilisateur. Responsive :
 * table sur écran large (≥ md, scrollable horizontalement en sécurité), cartes
 * empilées sur petit écran pour ne plus déborder. En mode sélection, une colonne
 * de cases à cocher apparaît (table) et une case superposée (cartes), pilotées
 * par `selection`.
 */
export function DeploymentsTable({ deployments, selection }: DeploymentsTableProps) {
  return (
    <>
      {/* Affichage large : table dense, masquée sous md. */}
      <Card className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-surface-sunken text-text-muted text-[11px] tracking-[0.06em] uppercase">
            <tr>
              {selection && (
                <th className="px-4 py-2.5 font-semibold">
                  <SelectionCheckbox
                    checked={selection.allSelected}
                    indeterminate={selection.someSelected}
                    onChange={selection.onToggleAll}
                    label="Tout sélectionner"
                  />
                </th>
              )}
              {HEADERS.map((header, index) => (
                <th key={header || `col-${index}`} className="px-4 py-2.5 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deployments.map((deployment) => (
              <DeploymentRow
                key={deployment.id}
                deployment={deployment}
                selection={rowSelectionFor(selection, deployment.id)}
              />
            ))}
          </tbody>
        </table>
      </Card>

      {/* Affichage mobile : cartes empilées, masquées à partir de md. */}
      <div data-testid="deployments-cards" className="space-y-3 md:hidden">
        {deployments.map((deployment) => (
          <DeploymentCard
            key={deployment.id}
            deployment={deployment}
            selection={rowSelectionFor(selection, deployment.id)}
          />
        ))}
      </div>
    </>
  )
}
