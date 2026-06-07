import { useLocation } from 'react-router-dom'

import { useCurrentUser } from '../../auth/hooks/useCurrentUser'
import { useLogout } from '../../auth/hooks/useLogout'
import { TOPBAR_TITLES, type TopBarTitle } from './navigation'
import { TopBarActions } from './topbar/TopBarActions'
import { TopBarSearch } from './topbar/TopBarSearch'
import { TopBarUser } from './topbar/TopBarUser'

interface TopBarProps {
  onMenuClick: () => void
  menuExpanded: boolean
}

const FALLBACK_TITLE: TopBarTitle = { title: 'StackNest', subtitle: '' }

/**
 * En-tête de la colonne de contenu : burger (mobile), titre contextuel de la
 * route, recherche globale, actions (notifications + thème) et bloc utilisateur.
 * Le titre est résolu depuis `navigation.ts` selon la route courante ;
 * l'utilisateur courant provient du seam `useCurrentUser` (fixture pour l'instant).
 */
export function TopBar({ onMenuClick, menuExpanded }: TopBarProps) {
  const { pathname } = useLocation()
  const { title, subtitle } = TOPBAR_TITLES[pathname] ?? FALLBACK_TITLE
  const user = useCurrentUser()
  const logout = useLogout()

  return (
    <header
      role="banner"
      className="bg-surface-elevated border-border flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:gap-4 md:px-6"
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Basculer la navigation"
        aria-expanded={menuExpanded}
        aria-controls="app-sidebar"
        className="text-text-secondary hover:bg-surface-sunken focus-visible:ring-cyan inline-flex h-9 w-9 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none md:hidden"
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

      <div className="min-w-0 flex-1">
        <p className="text-text-primary truncate text-[14.5px] font-semibold">{title}</p>
        {subtitle && <p className="text-text-muted truncate text-[11.5px]">{subtitle}</p>}
      </div>

      <TopBarSearch />
      <TopBarActions />
      <div className="bg-border hidden h-6 w-px sm:block" />
      <TopBarUser name={user.name} role={user.role} onLogout={() => logout.mutate()} />
    </header>
  )
}
