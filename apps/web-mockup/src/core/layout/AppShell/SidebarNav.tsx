import { useLocation } from 'react-router-dom';
import { SIDEBAR_NAV, type NavGroup } from './nav';
import { SidebarNavItem } from './SidebarNavItem';

interface SectionProps {
  label: string;
  group: NavGroup;
  isActive: (to: string) => boolean;
}

const NavSection = ({ label, group, isActive }: SectionProps) => (
  <>
    <div className="text-[10px] font-mono uppercase tracking-[0.14em] px-3 mb-1.5 mt-2 text-text-muted">
      {label}
    </div>
    <ul className="space-y-0.5">
      {SIDEBAR_NAV.filter((item) => item.group === group).map((item) => (
        <SidebarNavItem key={item.id} item={item} active={isActive(item.to)} />
      ))}
    </ul>
  </>
);

export function SidebarNav() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <nav className="flex-1 px-3 overflow-y-auto">
      <NavSection label="Plateforme" group="main" isActive={isActive} />
      <div className="mt-6">
        <NavSection label="Administration" group="admin" isActive={isActive} />
      </div>
    </nav>
  );
}
