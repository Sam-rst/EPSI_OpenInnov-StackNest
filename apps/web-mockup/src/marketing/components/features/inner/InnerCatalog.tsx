import { Icon } from '@core/ui';

const RESOURCES = [
  { icon: 'database', label: 'PostgreSQL' },
  { icon: 'server',   label: 'Redis' },
  { icon: 'box',      label: 'Node.js' },
  { icon: 'sparkles', label: 'Ollama' },
];

export function InnerCatalog() {
  return (
    <div className="grid grid-cols-2 gap-2 text-text-primary">
      {RESOURCES.map((resource) => (
        <div
          key={resource.label}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-surface-sunken border border-border"
        >
          <span className="w-7 h-7 rounded-md flex items-center justify-center bg-surface-elevated text-cyan border border-border">
            <Icon name={resource.icon} size={13} />
          </span>
          <span className="text-[13px] font-medium">{resource.label}</span>
        </div>
      ))}
    </div>
  );
}
