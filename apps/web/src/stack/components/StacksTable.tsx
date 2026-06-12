import type { StackSummary } from '../types/models/Stack'
import { StackListCard } from './StackListCard'
import { StackRow } from './StackRow'

interface StacksTableProps {
  stacks: readonly StackSummary[]
  isSelected: (id: string) => boolean
  onToggleSelect: (id: string) => void
  allSelected: boolean
  onToggleAll: () => void
}

const HEADERS: readonly string[] = ['Nom', 'Services', 'Statut', 'Créé le', '']

/**
 * Liste des stacks de l'utilisateur, comme la liste des déploiements. Responsive :
 * table dense sur écran large (≥ md), cartes empilées sur petit écran. Chaque
 * ligne/carte est cliquable vers le détail et porte une case de sélection pour
 * les actions groupées ; l'en-tête porte la case « tout sélectionner ».
 */
export function StacksTable({
  stacks,
  isSelected,
  onToggleSelect,
  allSelected,
  onToggleAll,
}: StacksTableProps) {
  return (
    <>
      {/* Affichage large : table dense, masquée sous md. */}
      <div className="border-border bg-surface-elevated hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-surface-sunken text-text-muted text-[11px] tracking-[0.06em] uppercase">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Tout sélectionner"
                  className="accent-cyan h-4 w-4 cursor-pointer align-middle"
                />
              </th>
              {HEADERS.map((header, index) => (
                <th key={header || `col-${index}`} className="px-4 py-2.5 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stacks.map((stack) => (
              <StackRow
                key={stack.id}
                stack={stack}
                selected={isSelected(stack.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Affichage mobile : cartes empilées, masquées à partir de md. */}
      <div data-testid="stacks-cards" className="space-y-3 md:hidden">
        {stacks.map((stack) => (
          <StackListCard
            key={stack.id}
            stack={stack}
            selected={isSelected(stack.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </>
  )
}
