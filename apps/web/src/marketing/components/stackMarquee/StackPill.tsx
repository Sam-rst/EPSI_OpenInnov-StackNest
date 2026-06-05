import { Icon } from '../../../shared/components/ui'
import type { StackItem } from '../../data/stack.data'

interface StackPillProps {
  item: StackItem
}

/** Pastille d'une brique de la stack technique (icône + nom monospace). */
export function StackPill({ item }: StackPillProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2.5 rounded-md border border-[#0d3e57] bg-[#073047] px-4 text-[#c7d4dd]">
      <Icon name={item.icon} size={15} className="text-cyan" />
      <span className="font-mono text-[13px] tracking-tight whitespace-nowrap">{item.name}</span>
    </div>
  )
}
