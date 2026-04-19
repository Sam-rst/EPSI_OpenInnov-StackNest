interface TopBarProps {
  onMenuClick: () => void
  menuExpanded: boolean
}

/**
 * Stub visuel de la TopBar — la version complete (logo, nav, status) arrive
 * avec STN-23. Ici on ne garde que ce dont l'AppLayout a besoin : le bouton
 * burger qui commande la Sidebar en mobile.
 */
export function TopBar({ onMenuClick, menuExpanded }: TopBarProps) {
  return (
    <header
      className="bg-night flex h-14 items-center gap-4 px-4 text-white shadow-sm"
      role="banner"
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Basculer la navigation"
        aria-expanded={menuExpanded}
        aria-controls="app-sidebar"
        className="focus-visible:ring-cyan inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none md:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="stroke-current"
        >
          <path d="M3 6h14M3 10h14M3 14h14" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <span className="font-semibold tracking-tight">StackNest</span>
    </header>
  )
}
