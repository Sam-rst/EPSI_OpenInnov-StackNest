import { Button, Icon } from '../../shared/components/ui'

interface StackBulkBarProps {
  selectedCount: number
  onClearSelection: () => void
  onDestroy: () => void
  destroying: boolean
}

/**
 * Barre d'actions groupées de la liste des stacks, visible dès qu'au moins une
 * stack est sélectionnée. Porte l'action de destruction en masse (confirmée en
 * amont par la page) et un bouton pour vider la sélection.
 */
export function StackBulkBar({
  selectedCount,
  onClearSelection,
  onDestroy,
  destroying,
}: StackBulkBarProps) {
  if (selectedCount === 0) {
    return null
  }

  const stackLabel = selectedCount > 1 ? 'stacks sélectionnées' : 'stack sélectionnée'

  return (
    <div
      role="region"
      aria-label="Actions groupées"
      className="border-border bg-surface-elevated mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
    >
      <span className="text-text-secondary inline-flex items-center gap-2 text-[13px] font-medium">
        <Icon name="check-square" size={15} className="text-cyan" />
        {selectedCount} {stackLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Tout désélectionner
        </Button>
        <Button variant="danger" size="sm" icon="trash-2" disabled={destroying} onClick={onDestroy}>
          {destroying ? 'Destruction…' : 'Détruire la sélection'}
        </Button>
      </div>
    </div>
  )
}
