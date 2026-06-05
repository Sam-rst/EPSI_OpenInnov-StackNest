import type { Persona } from '../../data/personas.data'

interface PersonasIndicatorsProps {
  personas: ReadonlyArray<Persona>
  active: number
  onSelect: (index: number) => void
}

const baseClass =
  'inline-flex items-center gap-2.5 px-3.5 h-9 rounded-md text-[12.5px] font-medium transition-colors'
const activeClass = 'bg-night text-text-inverse border border-transparent'
const idleClass = 'border border-border text-text-secondary'

/** Pastilles de sélection d'un persona (synchronisées avec le carousel). */
export function PersonasIndicators({ personas, active, onSelect }: PersonasIndicatorsProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {personas.map((persona, index) => (
        <button
          key={persona.name}
          type="button"
          onClick={() => {
            onSelect(index)
          }}
          className={`${baseClass} ${active === index ? activeClass : idleClass}`}
        >
          <span className="font-mono text-[10.5px] opacity-70">
            {String(index + 1).padStart(2, '0')}
          </span>
          {persona.name}
        </button>
      ))}
    </div>
  )
}
