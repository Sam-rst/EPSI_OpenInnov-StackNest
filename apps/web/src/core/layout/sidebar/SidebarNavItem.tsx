import { Link } from 'react-router-dom'

import { Icon } from '../../../shared/components/ui'
import { cn } from '../../../shared/lib/cn'
import type { NavItem } from '../navigation'

interface SidebarNavItemProps {
  item: NavItem
  active: boolean
  /** Referme le drawer mobile au clic (no-op sur desktop). */
  onNavigate?: () => void
}

/** Lien de navigation latérale avec icône, libellé et pastille optionnelle. */
export function SidebarNavItem({ item, active, onNavigate }: SidebarNavItemProps) {
  return (
    <li>
      <Link
        to={item.to}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-[13px] font-medium transition-colors',
          active
            ? 'text-cyan bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]'
            : 'text-text-secondary hover:bg-surface-sunken',
        )}
      >
        <Icon name={item.icon} size={15} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="bg-yellow text-night inline-flex h-4 items-center rounded px-1.5 text-[9px] font-bold tracking-wider uppercase">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  )
}
