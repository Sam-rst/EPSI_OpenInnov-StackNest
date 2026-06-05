import { Icon } from '../../../../shared/components/ui'

const RESOURCES = [
  { icon: 'database', label: 'PostgreSQL' },
  { icon: 'server', label: 'Redis' },
  { icon: 'box', label: 'Node.js' },
  { icon: 'sparkles', label: 'Ollama' },
]

/** Démo interne « catalogue » : grille de ressources sélectionnables. */
export function InnerCatalog() {
  return (
    <div className="text-text-primary grid grid-cols-2 gap-2">
      {RESOURCES.map((resource) => (
        <div
          key={resource.label}
          className="bg-surface-sunken border-border flex items-center gap-2.5 rounded-md border px-3 py-2.5"
        >
          <span className="bg-surface-elevated text-cyan border-border flex h-7 w-7 items-center justify-center rounded-md border">
            <Icon name={resource.icon} size={13} />
          </span>
          <span className="text-[13px] font-medium">{resource.label}</span>
        </div>
      ))}
    </div>
  )
}
