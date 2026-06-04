import { Icon } from '@core/ui';
import type { MockupResource } from './catalogMockup.data';

interface MockupResourceCardProps {
  resource: MockupResource;
}

export function MockupResourceCard({ resource }: MockupResourceCardProps) {
  return (
    <div className="rounded-lg border border-[#0d3e57] bg-[#021824] p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-md flex items-center justify-center bg-[color-mix(in_oklch,#0d9297_18%,transparent)] text-[#15979D]">
          <Icon name={resource.icon} size={16} />
        </span>
        <div className="font-semibold text-[13px]">{resource.name}</div>
      </div>
      <div className="text-[11.5px] text-[#94aabb] mt-2.5 leading-snug">{resource.desc}</div>
      <div className="flex items-center justify-between mt-3">
        <span className="px-2 h-5 inline-flex items-center text-[10px] uppercase tracking-wider font-semibold rounded border border-[#0d3e57] text-[#94aabb]">
          {resource.tag}
        </span>
        <span className="text-[#15979D] text-[11px] font-medium">Configurer →</span>
      </div>
    </div>
  );
}
