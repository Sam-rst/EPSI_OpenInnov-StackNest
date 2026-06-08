import { useState } from 'react'

import { Button } from '../../../shared/components/ui'
import { Card } from '../common/Card'
import { ConfirmDialog } from './ConfirmDialog'
import { availableActions } from './lifecycleAvailability'
import { useDeploymentActions } from '../../hooks/useDeploymentActions'
import type { DeploymentStatus } from '../../types/enums/DeploymentStatus'

interface LifecycleActionsProps {
  deploymentId: string
  status: DeploymentStatus
}

/**
 * Barre d'actions de cycle de vie (display-only) : Démarrer / Arrêter /
 * Régénérer le mot de passe / Détruire, selon le statut. La destruction passe
 * par une modale de confirmation.
 */
export function LifecycleActions({ deploymentId, status }: LifecycleActionsProps) {
  const actions = useDeploymentActions(deploymentId)
  const allowed = availableActions(status)
  const [confirmingDestroy, setConfirmingDestroy] = useState(false)

  const hasAnyAction =
    allowed.canStart || allowed.canStop || allowed.canRegenerate || allowed.canDestroy

  if (!hasAnyAction) {
    return (
      <Card className="p-4">
        <h2 className="text-text-muted mb-2 font-mono text-[11px] tracking-[0.14em] uppercase">
          Actions
        </h2>
        <p className="text-text-muted text-[12px]">Aucune action disponible dans cet état.</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h2 className="text-text-muted mb-3 font-mono text-[11px] tracking-[0.14em] uppercase">
        Actions
      </h2>
      <div className="space-y-2">
        {allowed.canStart && (
          <Button
            variant="secondary"
            icon="play"
            size="sm"
            className="w-full"
            onClick={() => actions.start.mutate()}
          >
            Démarrer
          </Button>
        )}
        {allowed.canStop && (
          <Button
            variant="secondary"
            icon="square"
            size="sm"
            className="w-full"
            onClick={() => actions.stop.mutate()}
          >
            Arrêter
          </Button>
        )}
        {allowed.canRegenerate && (
          <Button
            variant="secondary"
            icon="refresh-cw"
            size="sm"
            className="w-full"
            onClick={() => actions.regeneratePassword.mutate()}
          >
            Régénérer le mot de passe
          </Button>
        )}
        {allowed.canDestroy && (
          <Button
            variant="danger"
            icon="trash-2"
            size="sm"
            className="w-full"
            onClick={() => setConfirmingDestroy(true)}
          >
            Détruire
          </Button>
        )}
      </div>

      {confirmingDestroy && (
        <ConfirmDialog
          title="Détruire le déploiement ?"
          description="La ressource et ses données seront supprimées définitivement. Cette action est irréversible."
          confirmLabel="Détruire"
          onCancel={() => setConfirmingDestroy(false)}
          onConfirm={() => {
            setConfirmingDestroy(false)
            actions.destroy.mutate()
          }}
        />
      )}
    </Card>
  )
}
