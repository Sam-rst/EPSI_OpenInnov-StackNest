import { Icon } from '@core/ui';
import { SETTINGS_TABS, type SettingsTabId } from '../domain/tabs';

interface SettingsSidebarProps {
  active: SettingsTabId;
  onSelect: (tab: SettingsTabId) => void;
}

const baseClass = 'w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium transition';
const activeClass = 'bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan';
const idleClass = 'text-text-secondary hover:bg-surface-sunken';

export function SettingsSidebar({ active, onSelect }: SettingsSidebarProps) {
  return (
    <aside>
      <ul className="space-y-0.5">
        {SETTINGS_TABS.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`${baseClass} ${active === tab.id ? activeClass : idleClass}`}
            >
              <Icon name={tab.icon} size={14} />
              <span>{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
