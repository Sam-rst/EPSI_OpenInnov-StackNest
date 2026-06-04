import { useTheme } from '../../core/theme/useTheme'
import { cn } from '../lib/cn'

interface ThemeToggleProps {
  className?: string
}

/** Contrôle accessible de bascule clair/sombre (consomme `useTheme`). */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Activer le thème clair' : 'Activer le thème sombre'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'focus-visible:ring-cyan inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {isDark ? (
          <circle cx="12" cy="12" r="4" />
        ) : (
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        )}
        {isDark && (
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        )}
      </svg>
    </button>
  )
}
