import { Icon } from '@core/ui';
import type { StackItem } from './stack.data';

interface StackPillProps {
  item: StackItem;
}

export function StackPill({ item }: StackPillProps) {
  return (
    <div className="shrink-0 flex items-center gap-2.5 px-4 h-12 rounded-md bg-[#073047] border border-[#0d3e57] text-[#c7d4dd]">
      <Icon name={item.icon} size={15} className="text-cyan" />
      <span className="font-mono text-[13px] tracking-tight whitespace-nowrap">{item.name}</span>
    </div>
  );
}
