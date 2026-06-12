import { useState } from 'react'

import { Button } from '../../../shared/components/ui'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { BulkAction } from '../../types/enums/BulkAction'
import type { BulkActionAvailability } from './bulkActionAvailability'

interface BulkActionsBarProps {
  count: number
  availability: BulkActionAvailability
  onAction: (action: BulkAction) => void
  onClear: () => void
  isRunning: boolean
}

/** Accord singulier/pluriel du compteur de sélection. */
function selectionLabel(count: number): string {
  return count > 1 ? `${count} sélectionnés` : `${count} sélectionné`
}

/**
 * Barre d'actions groupées : visible dès qu'un déploiement est sélectionné.
 * Propose Arrêter / Démarrer / Supprimer avec un compteur. Les actions sont
 * désactivées si aucun élément sélectionné ne les autorise (au mieux) ou pendant
 * une exécution. La suppression (destructive) passe par une confirmation.
 */
export function BulkActionsBar({
  count,
  availability,
  onAction,
  onClear,
  isRunning,
}: BulkActionsBarProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (count === 0) {
    return null
  }

  return (
    <div
      role="region"
      aria-label="Actions groupées"
      className="border-cyan/40 bg-surface-elevated mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
    >
      <div className="flex items-center gap-3">
        <span className="text-text-primary text-[13px] font-semibold">{selectionLabel(count)}</span>
        <Button variant="ghost" size="sm" icon="x" onClick={onClear}>
          Désélectionner
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon="play"
          disabled={!availability.canStart || isRunning}
          onClick={() => onAction(BulkAction.START)}
        >
          Démarrer
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon="square"
          disabled={!availability.canStop || isRunning}
          onClick={() => onAction(BulkAction.STOP)}
        >
          Arrêter
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon="trash-2"
          disabled={!availability.canDestroy || isRunning}
          onClick={() => setConfirmingDelete(true)}
        >
          Supprimer
        </Button>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Supprimer les déploiements sélectionnés ?"
          description={`${selectionLabel(count)} : les ressources éligibles et leurs données seront supprimées définitivement. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false)
            onAction(BulkAction.DELETE)
          }}
        />
      )}
    </div>
  )
}
