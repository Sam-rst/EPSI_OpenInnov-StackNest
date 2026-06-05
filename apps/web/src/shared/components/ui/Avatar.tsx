import { cn } from '../../lib/cn'

interface AvatarProps {
  /** Nom complet — sert au calcul des initiales et au libellé accessible. */
  name: string
  /** Couleur de fond (par défaut cyan de marque). */
  color?: string
  /** Diamètre en pixels. */
  size?: number
  className?: string
}

const computeInitials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

/**
 * Pastille d'initiales pour représenter un utilisateur. Décoratif visuellement
 * mais expose `role="img"` + le nom complet en libellé pour les lecteurs d'écran.
 */
export function Avatar({ name, color = '#0d9297', size = 28, className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: color,
        lineHeight: 1,
      }}
    >
      {computeInitials(name)}
    </span>
  )
}
