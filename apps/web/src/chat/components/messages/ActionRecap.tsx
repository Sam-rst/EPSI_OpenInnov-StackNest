import type { ActionRecapEntry } from '../../types/models/ActionProposal'

interface ActionRecapProps {
  title: string
  entries: readonly ActionRecapEntry[]
}

/**
 * Bloc de récapitulatif clé/valeur d'une action (params ou quotas).
 * Rend `null` si la liste est vide, pour ne pas afficher de section creuse.
 */
export function ActionRecap({ title, entries }: ActionRecapProps) {
  if (entries.length === 0) {
    return null
  }

  return (
    <div className="mt-3">
      <div className="text-text-muted mb-1.5 font-mono text-[10px] tracking-[0.12em] uppercase">
        {title}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12.5px]">
        {entries.map((entry) => (
          <div key={entry.label} className="contents">
            <dt className="text-text-secondary">{entry.label}</dt>
            <dd className="text-text-primary text-right font-medium">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
