import { LogoMark } from '@core/ui';

export function SidebarHeader() {
  return (
    <div className="px-5 h-14 flex items-center gap-2.5 border-b border-border">
      <LogoMark size={24} />
      <span className="font-bold tracking-tight text-[15px] text-text-primary">StackNest</span>
      <span className="ml-auto text-[10px] font-mono px-1.5 h-5 inline-flex items-center rounded border border-border text-text-muted">
        v1.0
      </span>
    </div>
  );
}
