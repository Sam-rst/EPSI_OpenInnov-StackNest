import { cn } from '../../lib/cn'

interface AvatarProps {
  /** Nom complet ou email — sert au calcul des initiales et au libellé accessible. */
  name: string
  /** Couleur de fond (par défaut cyan de marque). */
  color?: string
  /** Diamètre en pixels. */
  size?: number
  className?: string
}

// Pour une adresse email (contient « @ »), on dérive les initiales de la partie
// locale découpée sur . _ - (ex. john.doe@x → « JD », qa-admin@x → « QA »).
// Sinon, première lettre de chaque mot séparé par des espaces.
const computeInitials = (name: string): string => {
  const atIndex = name.indexOf('@')
  const isEmail = atIndex > 0
  const source = isEmail ? name.slice(0, atIndex) : name
  const segments = isEmail ? source.split(/[._-]+/) : source.split(' ')
  return segments
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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
        // `normal` (et non `1`) : la line-box naturelle de la police est
        // symetrique autour de la glyphe -> capitales parfaitement centrees
        // verticalement dans le cercle (line-height:1 les remontait de ~1px).
        lineHeight: 'normal',
      }}
    >
      {computeInitials(name)}
    </span>
  )
}
