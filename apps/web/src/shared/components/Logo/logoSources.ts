export type LogoVariant = 'color' | 'mono-night' | 'mono-cyan' | 'mono-white' | 'mono-yellow'

/** Fichiers SVG servis depuis `public/assets/` (copiés depuis `docs/brand/assets/`). */
export const LOGO_SOURCES: Record<LogoVariant, string> = {
  color: '/assets/logo.svg',
  'mono-night': '/assets/logo-mono-night.svg',
  'mono-cyan': '/assets/logo-mono-cyan.svg',
  'mono-white': '/assets/logo-mono-white.svg',
  'mono-yellow': '/assets/logo-mono-yellow.svg',
}

/** Dimensions natives du symbole — ratio à préserver (charte : ne jamais déformer). */
export const LOGO_NATURAL_WIDTH = 97
export const LOGO_NATURAL_HEIGHT = 127
