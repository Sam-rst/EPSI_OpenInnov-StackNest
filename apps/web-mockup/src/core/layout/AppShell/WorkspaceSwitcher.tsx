import { Icon } from '@core/ui';

export function WorkspaceSwitcher() {
  return (
    <button className="m-3 flex items-center gap-2.5 px-3 h-11 rounded-md border border-border bg-surface hover:border-cyan transition">
      <span className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-[12px] text-white bg-cyan">
        SN
      </span>
      <span className="flex-1 text-left">
        <span className="block text-[12.5px] font-semibold text-text-primary">StackNest Lab</span>
        <span className="block text-[10.5px] text-text-muted">workspace · plan Team</span>
      </span>
      <Icon name="chevrons-up-down" size={13} className="opacity-60" />
    </button>
  );
}
