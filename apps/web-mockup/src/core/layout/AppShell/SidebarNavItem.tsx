import { Link } from 'react-router-dom';
import { Icon } from '@core/ui';
import type { NavItem } from './nav';

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
}

export function SidebarNavItem({ item, active }: SidebarNavItemProps) {
  const baseClass = 'w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium transition-colors';
  const activeClass = active
    ? 'bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan'
    : 'text-text-secondary hover:bg-surface-sunken';

  return (
    <li>
      <Link to={item.to} className={`${baseClass} ${activeClass}`}>
        <Icon name={item.icon} size={15} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 h-4 inline-flex items-center rounded bg-sun text-[#3a2a00]">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}
