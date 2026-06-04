import { SidebarHeader } from './SidebarHeader';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SidebarNav } from './SidebarNav';
import { SidebarCostCard } from './SidebarCostCard';

export function Sidebar() {
  return (
    <aside className="w-[244px] shrink-0 flex flex-col border-r border-border bg-surface-elevated">
      <SidebarHeader />
      <WorkspaceSwitcher />
      <SidebarNav />
      <SidebarCostCard />
    </aside>
  );
}
