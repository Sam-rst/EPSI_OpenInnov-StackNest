import { Badge, Icon } from './ui'
import { cn } from '../lib/cn'

/**
 * Formulation unique et réutilisée du rappel bêta. Centralisée ici pour qu'un
 * seul wording circule dans toute l'app (et soit assertable en test).
 */
export const BETA_BANNER_TEXT = 'Fonctionnalité en bêta — en cours de développement'

interface BetaBannerProps {
  /** Classes contextuelles (espacement vis-à-vis de la page hôte). */
  className?: string
}

const CONTAINER =
  'flex items-center gap-2.5 rounded-lg border border-[color-mix(in_oklch,var(--color-yellow)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-yellow)_12%,transparent)] px-3.5 py-2.5'

/**
 * Rappel honnête et **non bloquant** signalant qu'une feature est encore en
 * bêta / en cours de développement. Ton `warn` de la charte (jaune StackNest),
 * contraste AA en clair comme en sombre. `role="status"` : information passive
 * annoncée poliment aux lecteurs d'écran, jamais une alerte. Réutilisé tel quel
 * en tête des pages concernées (slice stack).
 */
export function BetaBanner({ className }: BetaBannerProps) {
  return (
    <div role="status" className={cn(CONTAINER, className)}>
      <Badge tone="warn" className="shrink-0">
        <Icon name="flask-conical" size={11} />
        Bêta
      </Badge>
      <p className="text-text-secondary text-[12.5px] leading-relaxed">{BETA_BANNER_TEXT}</p>
    </div>
  )
}
