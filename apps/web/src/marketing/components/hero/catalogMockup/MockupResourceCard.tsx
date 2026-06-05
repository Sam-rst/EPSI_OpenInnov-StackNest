import { Icon } from '../../../../shared/components/ui'
import type { MockupResource } from '../../../data/catalogMockup.data'

interface MockupResourceCardProps {
  resource: MockupResource
}

/** Carte de ressource du mockup catalogue (icône, nom, tag, action). */
export function MockupResourceCard({ resource }: MockupResourceCardProps) {
  return (
    <div className="rounded-lg border border-[#0d3e57] bg-[#021824] p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[color-mix(in_oklch,#0d9297_18%,transparent)] text-[#15979D]">
          <Icon name={resource.icon} size={16} />
        </span>
        <div className="text-[13px] font-semibold">{resource.name}</div>
      </div>
      <div className="mt-2.5 text-[11.5px] leading-snug text-[#94aabb]">{resource.desc}</div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex h-5 items-center rounded border border-[#0d3e57] px-2 text-[10px] font-semibold tracking-wider text-[#94aabb] uppercase">
          {resource.tag}
        </span>
        <span className="text-[11px] font-medium text-[#15979D]">Configurer →</span>
      </div>
    </div>
  )
}
