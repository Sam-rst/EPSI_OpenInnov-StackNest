import { Icon, LogoLockup } from '@core/ui';
import { MOCKUP_NAV } from './catalogMockup.data';

const ACTIVE_BG = 'bg-[color-mix(in_oklch,#0d9297_22%,transparent)] text-[#fffefa] font-medium';
const IDLE = 'text-[#94aabb]';

export function MockupSidebar() {
  return (
    <div className="p-4 border-r border-[#0d3e57] bg-[#021824]">
      <LogoLockup size={22} color="#fffefa" />
      <div className="mt-6 space-y-1">
        {MOCKUP_NAV.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] ${item.active ? ACTIVE_BG : IDLE}`}
          >
            <Icon name={item.icon} size={14} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
