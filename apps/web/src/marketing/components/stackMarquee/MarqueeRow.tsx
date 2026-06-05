import type { StackItem } from '../../data/stack.data'
import { StackPill } from './StackPill'

interface MarqueeRowProps {
  items: readonly StackItem[]
  direction: 'left' | 'right'
  prefix: string
}

/** Rangée de pastilles dupliquée pour un défilement horizontal en boucle. */
export function MarqueeRow({ items, direction, prefix }: MarqueeRowProps) {
  const animationClass = direction === 'left' ? 'marketing-marquee-left' : 'marketing-marquee-right'
  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden">
      <div className={`marketing-marquee-track ${animationClass}`}>
        {doubled.map((item, index) => (
          <StackPill key={`${prefix}-${index}`} item={item} />
        ))}
      </div>
    </div>
  )
}
