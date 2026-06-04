import { StackPill } from './StackPill';
import type { StackItem } from './stack.data';

interface MarqueeRowProps {
  items: ReadonlyArray<StackItem>;
  direction: 'left' | 'right';
  prefix: string;
}

export function MarqueeRow({ items, direction, prefix }: MarqueeRowProps) {
  const animationClass = direction === 'left' ? 'stn-mq-l' : 'stn-mq-r';
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden">
      <div className={`stn-mq-track ${animationClass}`}>
        {doubled.map((item, i) => (
          <StackPill key={`${prefix}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
