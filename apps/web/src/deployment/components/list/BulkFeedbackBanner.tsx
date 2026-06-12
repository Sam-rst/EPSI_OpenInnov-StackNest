import { Icon } from '../../../shared/components/ui'
import type { BulkFeedbackMessage } from './bulkActionFeedback'

interface BulkFeedbackBannerProps {
  message: BulkFeedbackMessage
  onDismiss: () => void
}

/** Classes de la bannière selon le ton du retour. */
const TONE_CLASSES: Record<BulkFeedbackMessage['tone'], string> = {
  success: 'border-success/40 text-success',
  warning: 'border-yellow/50 text-yellow',
  error: 'border-error/50 text-error',
}

/** Icône lucide associée à chaque ton. */
const TONE_ICONS: Record<BulkFeedbackMessage['tone'], string> = {
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'x-circle',
}

/**
 * Bannière de retour d'une action groupée (succès / partiel / échec), affichée
 * sous l'en-tête de la liste et fermable. Statut accessible (`role="status"`).
 */
export function BulkFeedbackBanner({ message, onDismiss }: BulkFeedbackBannerProps) {
  return (
    <div
      role="status"
      className={`bg-surface-elevated mb-4 flex items-center justify-between gap-3 rounded-lg border p-3 text-[13px] ${TONE_CLASSES[message.tone]}`}
    >
      <span className="inline-flex items-center gap-2">
        <Icon name={TONE_ICONS[message.tone]} size={15} />
        {message.text}
      </span>
      <button
        type="button"
        aria-label="Fermer le message"
        onClick={onDismiss}
        className="text-text-muted hover:text-text-primary transition"
      >
        <Icon name="x" size={15} />
      </button>
    </div>
  )
}
