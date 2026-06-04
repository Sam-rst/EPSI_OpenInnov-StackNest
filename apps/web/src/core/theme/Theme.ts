export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'stacknest-theme'

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark'

/**
 * Détermine le thème initial : valeur persistée en localStorage si valide,
 * sinon la préférence système (`prefers-color-scheme`), sinon `light`.
 */
export const readInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (isTheme(stored)) return stored

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
