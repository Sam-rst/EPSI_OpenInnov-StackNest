import { Icon } from '../../../shared/components/ui'

interface StopButtonProps {
  /** Abandonne la génération en cours. */
  onStop: () => void
}

/**
 * Bouton « Arrêter la génération » (A3), visible pendant `thinking`/`streaming`.
 * Rend la main à l'utilisateur sur les longues réponses (LLM lent) en coupant le
 * flux côté hook. Discret (puce neutre) pour ne pas concurrencer le contenu.
 */
export function StopButton({ onStop }: StopButtonProps) {
  return (
    <button
      type="button"
      onClick={onStop}
      className="border-border bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-border-strong inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors"
    >
      <Icon name="square" size={12} className="text-error" />
      Arrêter la génération
    </button>
  )
}
