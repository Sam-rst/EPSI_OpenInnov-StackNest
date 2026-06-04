import {
  LOGO_NATURAL_HEIGHT,
  LOGO_NATURAL_WIDTH,
  LOGO_SOURCES,
  type LogoVariant,
} from './logoSources'

interface LogoMarkProps {
  size?: number
  variant?: LogoVariant
  alt?: string
  className?: string
}

/** Symbole StackNest seul, servi depuis `public/assets/` en préservant le ratio natif. */
export function LogoMark({
  size = 28,
  variant = 'color',
  alt = 'StackNest',
  className,
}: LogoMarkProps) {
  const height = Math.round((size * LOGO_NATURAL_HEIGHT) / LOGO_NATURAL_WIDTH)

  return (
    <img
      src={LOGO_SOURCES[variant]}
      width={size}
      height={height}
      alt={alt}
      draggable={false}
      className={className}
    />
  )
}
