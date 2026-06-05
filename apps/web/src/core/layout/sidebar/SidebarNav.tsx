import { useLocation } from 'react-router-dom'

import { SIDEBAR_NAV, type NavGroup } from '../navigation'
import { SidebarNavItem } from './SidebarNavItem'

interface SidebarNavProps {
  /** Forwardé aux items pour refermer le drawer mobile au clic. */
  onNavigate?: () => void
}

interface NavSectionProps {
  label: string
  group: NavGroup
  isActive: (to: string) => boolean
  onNavigate?: () => void
}

function NavSection({ label, group, isActive, onNavigate }: NavSectionProps) {
  return (
    <div>
      <p className="text-text-muted mt-2 mb-1.5 px-3 font-mono text-[10px] tracking-[0.14em] uppercase">
        {label}
      </p>
      <ul className="space-y-0.5">
        {SIDEBAR_NAV.filter((item) => item.group === group).map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={isActive(item.to)}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  )
}

/**
 * Sections de navigation groupées (Plateforme / Administration).
 * Rendu en `<div>` volontairement : le landmark `navigation` est porté par la
 * Sidebar parente, on évite ici un second rôle navigation.
 */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { pathname } = useLocation()
  const isActive = (to: string): boolean => pathname === to || pathname.startsWith(`${to}/`)

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
      <NavSection label="Plateforme" group="main" isActive={isActive} onNavigate={onNavigate} />
      <NavSection
        label="Administration"
        group="admin"
        isActive={isActive}
        onNavigate={onNavigate}
      />
    </div>
  )
}
