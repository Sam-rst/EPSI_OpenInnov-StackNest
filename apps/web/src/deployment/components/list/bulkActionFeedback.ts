import { BulkAction } from '../../types/enums/BulkAction'
import type { BulkActionOutcome } from '../../hooks/useBulkDeploymentActions'

/** Ton d'affichage du retour d'une action groupée. */
export type BulkFeedbackTone = 'success' | 'warning' | 'error'

/** Message de retour prêt à afficher (ton + texte français accordé). */
export interface BulkFeedbackMessage {
  tone: BulkFeedbackTone
  text: string
}

/** Participe passé accordable selon l'action, pour la part « réussie ». */
const SUCCESS_VERB: Record<BulkAction, string> = {
  [BulkAction.STOP]: 'arrêté',
  [BulkAction.START]: 'démarré',
  [BulkAction.DELETE]: 'supprimé',
}

/** Accord « déploiement(s) » + suffixe pluriel du participe. */
function pluralize(count: number, verb: string): string {
  const suffix = count > 1 ? 's' : ''
  return `${count} déploiement${suffix} ${verb}${suffix}`
}

/**
 * Construit le message de retour d'une exécution groupée à partir du bilan
 * succès/échec par item. Trois tons : succès total, succès partiel (warning) et
 * échec total (error). Pur (testable sans rendu).
 */
export function bulkOutcomeMessage(outcome: BulkActionOutcome): BulkFeedbackMessage {
  const successCount = outcome.succeeded.length
  const failureCount = outcome.failed.length
  const verb = SUCCESS_VERB[outcome.action]

  if (failureCount === 0) {
    return { tone: 'success', text: `${pluralize(successCount, verb)} avec succès.` }
  }

  const failurePart = `${failureCount} ${failureCount > 1 ? 'ont échoué' : 'a échoué'}`

  if (successCount === 0) {
    return { tone: 'error', text: `Action impossible : ${failurePart}.` }
  }

  return {
    tone: 'warning',
    text: `${pluralize(successCount, verb)}, ${failurePart}.`,
  }
}
