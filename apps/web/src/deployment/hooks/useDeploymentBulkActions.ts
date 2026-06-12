import { useCallback, useMemo, useState } from 'react'

import {
  bulkActionAvailability,
  type BulkActionAvailability,
} from '../components/list/bulkActionAvailability'
import { bulkOutcomeMessage, type BulkFeedbackMessage } from '../components/list/bulkActionFeedback'
import { useBulkDeploymentActions } from './useBulkDeploymentActions'
import { useDeploymentSelection, type DeploymentSelection } from './useDeploymentSelection'
import type { BulkAction } from '../types/enums/BulkAction'
import type { DeploymentStatus } from '../types/enums/DeploymentStatus'
import type { Deployment } from '../types/models/Deployment'

interface UseDeploymentBulkActionsResult {
  selection: DeploymentSelection
  availability: BulkActionAvailability
  isRunning: boolean
  feedback: BulkFeedbackMessage | null
  runAction: (action: BulkAction) => Promise<void>
  dismissFeedback: () => void
}

/**
 * Orchestration des actions en masse de la liste : sélection multiple,
 * disponibilité « au mieux » selon les statuts sélectionnés, exécution en
 * fan-out et retour utilisateur. Garde la page mince (composition de hooks).
 */
export function useDeploymentBulkActions(
  deployments: readonly Deployment[],
): UseDeploymentBulkActionsResult {
  const visibleIds = useMemo(() => deployments.map((item) => item.id), [deployments])
  const selection = useDeploymentSelection(visibleIds)
  const { run, isRunning } = useBulkDeploymentActions()
  const [feedback, setFeedback] = useState<BulkFeedbackMessage | null>(null)

  const statusById = useMemo(() => {
    const map = new Map<string, DeploymentStatus>()
    deployments.forEach((item) => map.set(item.id, item.status))
    return map
  }, [deployments])

  const selectedStatuses = useMemo(
    () =>
      selection.selectedIds
        .map((id) => statusById.get(id))
        .filter((status): status is DeploymentStatus => status !== undefined),
    [selection.selectedIds, statusById],
  )

  const availability = useMemo(() => bulkActionAvailability(selectedStatuses), [selectedStatuses])

  const runAction = useCallback(
    async (action: BulkAction): Promise<void> => {
      const ids = selection.selectedIds
      if (ids.length === 0) {
        return
      }
      const outcome = await run(action, ids)
      setFeedback(bulkOutcomeMessage(outcome))
      selection.clear()
    },
    [run, selection],
  )

  const dismissFeedback = useCallback(() => setFeedback(null), [])

  return { selection, availability, isRunning, feedback, runAction, dismissFeedback }
}
