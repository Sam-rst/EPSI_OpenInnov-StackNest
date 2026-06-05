import { LogoLockup } from '../../../../shared/components/Logo'
import { Icon } from '../../../../shared/components/ui'
import { MOCKUP_NAV } from '../../../data/catalogMockup.data'

const ACTIVE_BG = 'bg-[color-mix(in_oklch,#0d9297_22%,transparent)] text-[#fffefa] font-medium'
const IDLE = 'text-[#94aabb]'

/** Colonne de navigation latérale du mockup catalogue affiché dans le hero. */
export function MockupSidebar() {
  return (
    <div className="border-r border-[#0d3e57] bg-[#021824] p-4 text-[#fffefa]">
      <LogoLockup size={22} />
      <div className="mt-6 space-y-1">
        {MOCKUP_NAV.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[12.5px] ${item.active ? ACTIVE_BG : IDLE}`}
          >
            <Icon name={item.icon} size={14} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
