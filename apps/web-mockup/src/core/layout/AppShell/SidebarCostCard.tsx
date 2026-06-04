import { Icon } from '@core/ui';

export function SidebarCostCard() {
  return (
    <div className="m-3 p-3.5 rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between">
        <div className="text-[11.5px] font-semibold text-text-primary">Coût ce mois</div>
        <Icon name="trending-up" size={13} className="text-success" />
      </div>
      <div className="mt-1 font-mono text-[20px] font-bold text-text-primary">487&nbsp;€</div>
      <div className="mt-1 text-[11px] text-text-muted">+8 % vs. mois dernier</div>
      <div className="mt-2.5 h-1.5 rounded-full overflow-hidden bg-surface-sunken">
        <div className="h-full w-[64%] bg-cyan" />
      </div>
    </div>
  );
}
