import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { destroyDeployment, startDeployment, stopDeployment } from '../services/deploymentService'
import { BulkAction } from '../types/enums/BulkAction'
import { DEPLOYMENTS_QUERY_KEY } from './useDeployments'

/** Résultat d'une exécution groupée : ids réussis / échoués (succès partiel possible). */
export interface BulkActionOutcome {
  action: BulkAction
  succeeded: readonly string[]
  failed: readonly string[]
}

interface UseBulkDeploymentActionsResult {
  /** Exécute l'action sur tous les ids (fan-out parallèle) et renvoie le bilan. */
  run: (action: BulkAction, ids: readonly string[]) => Promise<BulkActionOutcome>
  /** Vrai tant qu'une exécution groupée est en cours. */
  isRunning: boolean
}

/** Fonction REST unitaire associée à chaque action groupée. */
const ACTION_REQUESTS: Record<BulkAction, (id: string) => Promise<void>> = {
  [BulkAction.STOP]: stopDeployment,
  [BulkAction.START]: startDeployment,
  [BulkAction.DELETE]: destroyDeployment,
}

/**
 * Orchestration des actions groupées par fan-out côté front : N appels
 * parallèles vers les endpoints unitaires existants (`stop` / `start` /
 * `destroy`), sans nouvel endpoint bulk côté back. Chaque item est isolé
 * (`Promise.allSettled`) pour remonter un bilan succès/échec partiel, puis la
 * liste est invalidée une seule fois en fin d'exécution.
 */
export function useBulkDeploymentActions(): UseBulkDeploymentActionsResult {
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)

  const run = useCallback(
    async (action: BulkAction, ids: readonly string[]): Promise<BulkActionOutcome> => {
      const request = ACTION_REQUESTS[action]
      setIsRunning(true)
      try {
        const results = await Promise.allSettled(ids.map((id) => request(id)))

        const succeeded: string[] = []
        const failed: string[] = []
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            succeeded.push(ids[index])
          } else {
            failed.push(ids[index])
          }
        })

        await queryClient.invalidateQueries({ queryKey: DEPLOYMENTS_QUERY_KEY })
        return { action, succeeded, failed }
      } finally {
        setIsRunning(false)
      }
    },
    [queryClient],
  )

  return { run, isRunning }
}
